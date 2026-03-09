from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.db.models import Q, Count, Avg
from django.utils import timezone
from .models import Task, TaskType, TaskImage, TaskComment, TaskEvaluation, TaskHistory
from .serializers import (
    TaskSerializer, TaskDetailSerializer, TaskTypeSerializer,
    TaskImageSerializer, TaskCommentSerializer, TaskEvaluationSerializer,
    TaskHistorySerializer
)
from accounts.models import Team
from django.db import transaction


def create_task_history(task, action, changed_by, field_name=None, old_value=None, new_value=None, description=None):
    """Helper function to create task history entry"""
    TaskHistory.objects.create(
        task=task,
        action=action,
        changed_by=changed_by,
        field_name=field_name,
        old_value=str(old_value) if old_value else None,
        new_value=str(new_value) if new_value else None,
        description=description or f'{changed_by.username} قام بـ {dict(TaskHistory.ACTION_CHOICES).get(action, action)}'
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_type_list_create(request):
    """قائمة أنواع المهام وإنشاء نوع جديد"""
    if request.method == 'GET':
        types = TaskType.objects.all()
        serializer = TaskTypeSerializer(types, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_admin:
            return Response(
                {'error': 'فقط المدير يمكنه إنشاء أنواع المهام'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = TaskTypeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    """قائمة المهام وإنشاء مهمة جديدة"""
    if request.method == 'GET':
        tasks = Task.objects.select_related(
            'created_by', 'assigned_to', 'supervisor', 'team', 'task_type'
        ).prefetch_related('images', 'comments', 'evaluations').all()
        
        # Filtering based on user role
        if request.user.is_employee:
            tasks = tasks.filter(Q(assigned_to=request.user) | Q(team__members=request.user))
        elif request.user.is_supervisor:
            tasks = tasks.filter(Q(supervisor=request.user) | Q(team__members__supervisor=request.user))
        elif request.user.is_admin:
            # Admin can see all tasks or filter
            created_by = request.query_params.get('created_by')
            if created_by:
                tasks = tasks.filter(created_by_id=created_by)
        
        # Additional filters
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        priority_filter = request.query_params.get('priority')
        if priority_filter:
            tasks = tasks.filter(priority=priority_filter)
        
        task_type_filter = request.query_params.get('task_type')
        if task_type_filter:
            tasks = tasks.filter(task_type_id=task_type_filter)
        
        team_filter = request.query_params.get('team')
        if team_filter:
            tasks = tasks.filter(team_id=team_filter)
        
        assigned_to_filter = request.query_params.get('assigned_to')
        if assigned_to_filter:
            tasks = tasks.filter(assigned_to_id=assigned_to_filter)
        
        serializer = TaskSerializer(tasks.distinct(), many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not (request.user.is_admin or request.user.is_supervisor):
            return Response(
                {'error': 'فقط المدير أو المشرف يمكنه إنشاء المهام'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(created_by=request.user)
            
            # Create history entry for task creation
            create_task_history(
                task=task,
                action='created',
                changed_by=request.user,
                description=f'تم إنشاء المهمة بواسطة {request.user.username}'
            )
            
            # Create notification for assigned employee
            if task.assigned_to:
                from notifications.models import Notification
                Notification.objects.create(
                    user=task.assigned_to,
                    title='مهمة جديدة',
                    message=f'تم تعيين مهمة جديدة لك: {task.title}',
                    task=task
                )
            
            # Notify team members if assigned to team
            if task.team:
                from notifications.models import Notification
                for member in task.team.members.all():
                    Notification.objects.create(
                        user=member,
                        title='مهمة جديدة للفريق',
                        message=f'تم تعيين مهمة جديدة لفريقك: {task.title}',
                        task=task
                    )
            
            return Response(TaskDetailSerializer(task, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    """تفاصيل المهمة وتحديثها وحذفها"""
    try:
        task = Task.objects.select_related(
            'created_by', 'assigned_to', 'supervisor', 'team', 'task_type'
        ).prefetch_related('images', 'comments', 'evaluations').get(pk=pk)
    except Task.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    if request.user.is_employee:
        if task.assigned_to != request.user and (not task.team or request.user not in task.team.members.all()):
            return Response(
                {'error': 'ليس لديك صلاحية للوصول لهذه المهمة'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    if request.method == 'GET':
        task = Task.objects.select_related(
            'created_by', 'assigned_to', 'supervisor', 'team', 'task_type'
        ).prefetch_related('images', 'comments', 'evaluations', 'history').get(pk=pk)
        serializer = TaskDetailSerializer(task, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        can_edit = (
            request.user.is_admin or
            (request.user.is_supervisor and task.supervisor == request.user) or
            (request.user == task.assigned_to)
        )
        
        if not can_edit:
            return Response(
                {'error': 'ليس لديك صلاحية لتعديل هذه المهمة'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check for completion reopen warnings
        old_status = task.status
        new_status = request.data.get('status', old_status)
        was_completed = old_status == 'completed'
        will_be_completed = new_status == 'completed'
        is_reopening = was_completed and new_status != 'completed'
        
        # Count how many times task was reopened after completion
        reopen_count = TaskHistory.objects.filter(
            task=task,
            action__in=['status_changed', 'reopened'],
            old_value__icontains='completed',
            new_value__in=['pending', 'in_progress', 'on_hold']
        ).count()
        
        warnings = []
        if is_reopening and reopen_count >= 3:
            warnings.append({
                'type': 'warning',
                'message': f'تحذير: تم تعديل هذه المهمة المكتملة {reopen_count + 1} مرات. يرجى مراجعة الحالة.'
            })
        
        serializer = TaskSerializer(task, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            # Store old values for history
            old_values = {}
            for field in ['status', 'assigned_to', 'priority', 'task_type', 'team', 'supervisor']:
                old_values[field] = getattr(task, field)
            
            updated_task = serializer.save()
            
            # Track status changes
            if 'status' in request.data and old_status != new_status:
                if was_completed and not will_be_completed:
                    create_task_history(
                        task=updated_task,
                        action='reopened',
                        changed_by=request.user,
                        field_name='status',
                        old_value=old_status,
                        new_value=new_status,
                        description=f'تم إعادة فتح المهمة من {old_status} إلى {new_status}'
                    )
                elif not was_completed and will_be_completed:
                    create_task_history(
                        task=updated_task,
                        action='completed',
                        changed_by=request.user,
                        field_name='status',
                        old_value=old_status,
                        new_value=new_status,
                    )
                else:
                    create_task_history(
                        task=updated_task,
                        action='status_changed',
                        changed_by=request.user,
                        field_name='status',
                        old_value=old_status,
                        new_value=new_status,
                    )
            
            # Track assignment changes
            if 'assigned_to' in request.data:
                old_assigned = old_values.get('assigned_to')
                new_assigned = updated_task.assigned_to
                if old_assigned != new_assigned:
                    if old_assigned and not new_assigned:
                        create_task_history(
                            task=updated_task,
                            action='unassigned',
                            changed_by=request.user,
                            field_name='assigned_to',
                            old_value=str(old_assigned),
                            new_value='لا يوجد',
                        )
                    elif new_assigned:
                        create_task_history(
                            task=updated_task,
                            action='assigned',
                            changed_by=request.user,
                            field_name='assigned_to',
                            old_value=str(old_assigned) if old_assigned else 'لا يوجد',
                            new_value=str(new_assigned),
                        )
            
            # Track other field changes
            for field in ['priority', 'task_type', 'team', 'supervisor']:
                if field in request.data:
                    old_val = old_values.get(field)
                    new_val = getattr(updated_task, field)
                    if old_val != new_val:
                        create_task_history(
                            task=updated_task,
                            action='updated',
                            changed_by=request.user,
                            field_name=field,
                            old_value=str(old_val) if old_val else 'لا يوجد',
                            new_value=str(new_val) if new_val else 'لا يوجد',
                        )
            
            # Update completed_at if status changed to completed
            if will_be_completed and not updated_task.completed_at:
                updated_task.completed_at = timezone.now()
                updated_task.save()
            elif not will_be_completed and updated_task.completed_at:
                updated_task.completed_at = None
                updated_task.save()
            
            # Notify supervisor/admin when employee updates status
            if request.user.is_employee and 'status' in request.data and updated_task.supervisor:
                from notifications.models import Notification
                Notification.objects.create(
                    user=updated_task.supervisor,
                    title='تحديث المهمة',
                    message=f'تم تحديث حالة المهمة "{updated_task.title}" من قبل {request.user.username}',
                    task=updated_task
                )
            
            # Refresh task with history
            updated_task = Task.objects.select_related(
                'created_by', 'assigned_to', 'supervisor', 'team', 'task_type'
            ).prefetch_related('images', 'comments', 'evaluations', 'history').get(pk=pk)
            
            response_data = TaskDetailSerializer(updated_task, context={'request': request}).data
            if warnings:
                response_data['warnings'] = warnings
            
            return Response(response_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not (request.user.is_admin and task.created_by == request.user):
            return Response(
                {'error': 'فقط منشئ المهمة يمكنه حذفها'},
                status=status.HTTP_403_FORBIDDEN
            )
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def task_image_upload(request, task_id):
    """رفع صورة للمهمة"""
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    can_upload = (
        request.user.is_admin or
        request.user == task.assigned_to or
        request.user == task.supervisor or
        (task.team and request.user in task.team.members.all())
    )
    
    if not can_upload:
        return Response(
            {'error': 'ليس لديك صلاحية لرفع صور لهذه المهمة'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = TaskImageSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        image = serializer.save(task=task, uploaded_by=request.user)
        return Response(TaskImageSerializer(image, context={'request': request}).data, 
                      status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_comment_list_create(request, task_id):
    """قائمة تعليقات المهمة وإنشاء تعليق جديد"""
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    if request.user.is_employee:
        if task.assigned_to != request.user and (not task.team or request.user not in task.team.members.all()):
            return Response(
                {'error': 'ليس لديك صلاحية للتعليق على هذه المهمة'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    if request.method == 'GET':
        parent_id = request.query_params.get('parent')
        if parent_id:
            comments = task.comments.filter(parent_id=parent_id).order_by('created_at')
        else:
            comments = task.comments.filter(parent__isnull=True).order_by('created_at')
        
        serializer = TaskCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TaskCommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save(task=task, user=request.user)
            
            # Notify task participants
            from notifications.models import Notification
            participants = set([task.created_by, task.assigned_to, task.supervisor])
            if task.team:
                participants.update(task.team.members.all())
            participants.discard(request.user)  # Don't notify self
            participants.discard(None)
            
            for participant in participants:
                Notification.objects.create(
                    user=participant,
                    title='تعليق جديد',
                    message=f'تم إضافة تعليق جديد على المهمة "{task.title}"',
                    task=task
                )
            
            return Response(TaskCommentSerializer(comment, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_comment_detail(request, comment_id):
    """تحديث أو حذف تعليق"""
    try:
        comment = TaskComment.objects.get(pk=comment_id)
    except TaskComment.DoesNotExist:
        return Response({'error': 'التعليق غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.user != comment.user and not request.user.is_admin:
        return Response(
            {'error': 'ليس لديك صلاحية لتعديل هذا التعليق'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'PUT':
        serializer = TaskCommentSerializer(comment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save(edited=True)
            return Response(TaskCommentSerializer(comment, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def evaluation_list_create(request):
    """قائمة التقييمات وإنشاء تقييم جديد"""
    if request.method == 'GET':
        evaluations = TaskEvaluation.objects.select_related(
            'task', 'evaluated_by', 'evaluated_employee'
        ).all()
        
        # Filter by employee
        employee_id = request.query_params.get('employee')
        if employee_id:
            evaluations = evaluations.filter(evaluated_employee_id=employee_id)
        
        # Filter by task
        task_id = request.query_params.get('task')
        if task_id:
            evaluations = evaluations.filter(task_id=task_id)
        
        # Filter by criteria
        criteria = request.query_params.get('criteria')
        if criteria:
            evaluations = evaluations.filter(criteria=criteria)
        
        if request.user.is_employee:
            evaluations = evaluations.filter(evaluated_employee=request.user)
        elif request.user.is_supervisor:
            evaluations = evaluations.filter(
                Q(evaluated_by=request.user) | 
                Q(evaluated_employee__supervisor=request.user)
            )
        
        serializer = TaskEvaluationSerializer(evaluations, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not (request.user.is_admin or request.user.is_supervisor):
            return Response(
                {'error': 'فقط المدير أو المشرف يمكنه تقييم المهام'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskEvaluationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            evaluation = serializer.save(evaluated_by=request.user)
            
            # Notify employee about evaluation
            if evaluation.evaluated_employee:
                from notifications.models import Notification
                Notification.objects.create(
                    user=evaluation.evaluated_employee,
                    title='تقييم المهمة',
                    message=f'تم تقييم مهمتك "{evaluation.task.title}" في {evaluation.get_criteria_display()}',
                    task=evaluation.task
                )
            
            return Response(TaskEvaluationSerializer(evaluation, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_history_list(request, task_id):
    """سجل المهمة"""
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    can_view = (
        request.user.is_admin or
        task.created_by == request.user or
        task.assigned_to == request.user or
        task.supervisor == request.user or
        (task.team and request.user in task.team.members.all())
    )
    if not can_view:
        return Response(
            {'error': 'ليس لديك صلاحية لعرض سجل هذه المهمة'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    history = TaskHistory.objects.filter(task=task).select_related('changed_by').order_by('-created_at')
    serializer = TaskHistorySerializer(history, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_statistics(request):
    """إحصائيات المهام"""
    from django.db.models import Count, Q, Avg, F
    from django.utils import timezone
    
    if request.user.is_admin:
        tasks = Task.objects.all()
        employees = request.user.__class__.objects.filter(role='employee')
    elif request.user.is_supervisor:
        tasks = Task.objects.filter(
            Q(supervisor=request.user) | Q(team__members__supervisor=request.user)
        )
        employees = request.user.__class__.objects.filter(supervisor=request.user)
    else:
        tasks = Task.objects.filter(
            Q(assigned_to=request.user) | Q(team__members=request.user)
        )
        employees = None
    
    now = timezone.now()
    
    stats = {
        'total_tasks': tasks.count(),
        'pending_tasks': tasks.filter(status='pending').count(),
        'in_progress_tasks': tasks.filter(status='in_progress').count(),
        'completed_tasks': tasks.filter(status='completed').count(),
        'cancelled_tasks': tasks.filter(status='cancelled').count(),
        'on_hold_tasks': tasks.filter(status='on_hold').count(),
        'overdue_tasks': tasks.filter(
            status__in=['pending', 'in_progress'],
            due_date__lt=now
        ).count(),
        'high_priority_tasks': tasks.filter(priority='high').count(),
        'urgent_tasks': tasks.filter(priority='urgent').count(),
        'tasks_by_status': {
            'pending': tasks.filter(status='pending').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'completed': tasks.filter(status='completed').count(),
            'cancelled': tasks.filter(status='cancelled').count(),
            'on_hold': tasks.filter(status='on_hold').count(),
        },
        'tasks_by_priority': {
            'low': tasks.filter(priority='low').count(),
            'medium': tasks.filter(priority='medium').count(),
            'high': tasks.filter(priority='high').count(),
            'urgent': tasks.filter(priority='urgent').count(),
        },
    }
    
    if request.user.is_admin or request.user.is_supervisor:
        if employees:
            stats['employees_stats'] = []
            for employee in employees:
                emp_tasks = tasks.filter(assigned_to=employee)
                stats['employees_stats'].append({
                    'employee_id': employee.id,
                    'employee_name': employee.username,
                    'total_tasks': emp_tasks.count(),
                    'completed_tasks': emp_tasks.filter(status='completed').count(),
                    'pending_tasks': emp_tasks.filter(status='pending').count(),
                    'average_rating': employee.average_rating or 0,
                })
        
        # Team Statistics - الأكثر استجابة
        if request.user.is_admin:
            teams = Team.objects.annotate(
                total_tasks=Count('tasks'),
                completed_tasks=Count('tasks', filter=Q(tasks__status='completed')),
            ).filter(total_tasks__gt=0)
            
            stats['teams_stats'] = []
            for team in teams:
                team_tasks = Task.objects.filter(team=team)
                total = team.total_tasks
                completed = team.completed_tasks
                response_rate = (completed * 100.0 / total) if total > 0 else 0
                
                stats['teams_stats'].append({
                    'team_id': team.id,
                    'team_name': team.name,
                    'total_tasks': total,
                    'completed_tasks': completed,
                    'pending_tasks': team_tasks.filter(status='pending').count(),
                    'response_rate': round(response_rate, 2),
                    'members_count': team.members.count(),
                })
            
            # Sort teams by response rate (most responsive first) - Top 10
            stats['teams_stats'] = sorted(
                stats['teams_stats'],
                key=lambda x: x['response_rate'],
                reverse=True
            )[:10]
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_ratings(request, employee_id):
    """تقييمات موظف معين"""
    from accounts.models import User
    
    try:
        employee = User.objects.get(pk=employee_id, role='employee')
    except User.DoesNotExist:
        return Response({'error': 'الموظف غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.user.is_employee and request.user != employee:
        return Response(
            {'error': 'ليس لديك صلاحية لعرض تقييمات هذا الموظف'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    evaluations = TaskEvaluation.objects.filter(evaluated_employee=employee).select_related(
        'task', 'evaluated_by'
    )
    
    # Group by criteria
    criteria_stats = {}
    for criteria, display in TaskEvaluation.CRITERIA_CHOICES:
        crit_evaluations = evaluations.filter(criteria=criteria)
        if crit_evaluations.exists():
            criteria_stats[criteria] = {
                'display': display,
                'count': crit_evaluations.count(),
                'average': crit_evaluations.aggregate(Avg('rating'))['rating__avg'],
            }
    
    return Response({
        'employee': {
            'id': employee.id,
            'username': employee.username,
            'name': f"{employee.first_name} {employee.last_name}".strip() or employee.username,
            'average_rating': employee.average_rating,
            'total_evaluations': evaluations.count(),
        },
        'criteria_stats': criteria_stats,
        'recent_evaluations': TaskEvaluationSerializer(
            evaluations[:10], many=True, context={'request': request}
        ).data,
    })
