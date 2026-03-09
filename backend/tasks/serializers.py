from rest_framework import serializers
from .models import Task, TaskType, TaskImage, TaskComment, TaskEvaluation, TaskHistory
from accounts.serializers import UserSerializer, TeamSerializer


class TaskTypeSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskType
        fields = ('id', 'name', 'description', 'color', 'icon', 'tasks_count', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()


class TaskImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    uploaded_by_avatar = serializers.ImageField(source='uploaded_by.avatar', read_only=True)
    
    class Meta:
        model = TaskImage
        fields = ('id', 'task', 'image', 'image_url', 'caption', 'uploaded_by', 
                 'uploaded_by_name', 'uploaded_by_avatar', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at')
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    replies_count = serializers.ReadOnlyField()
    
    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'user', 'user_name', 'user_avatar', 'user_full_name',
                 'content', 'parent', 'replies', 'replies_count', 'created_at', 
                 'updated_at', 'edited')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'edited')
    
    def get_user_full_name(self, obj):
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username
    
    def get_replies(self, obj):
        replies = obj.replies.all()[:5]  # أول 5 ردود
        return TaskCommentSerializer(replies, many=True, context=self.context).data


class TaskEvaluationSerializer(serializers.ModelSerializer):
    evaluated_by_name = serializers.CharField(source='evaluated_by.username', read_only=True)
    evaluated_by_avatar = serializers.ImageField(source='evaluated_by.avatar', read_only=True)
    evaluated_employee_name = serializers.CharField(source='evaluated_employee.username', read_only=True)
    evaluated_employee_avatar = serializers.ImageField(source='evaluated_employee.avatar', read_only=True)
    criteria_display = serializers.CharField(source='get_criteria_display', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = TaskEvaluation
        fields = ('id', 'task', 'task_title', 'rating', 'criteria', 'criteria_display',
                 'feedback', 'evaluated_by', 'evaluated_by_name', 'evaluated_by_avatar',
                 'evaluated_employee', 'evaluated_employee_name', 'evaluated_employee_avatar',
                 'evaluated_at', 'updated_at')
        read_only_fields = ('id', 'evaluated_at', 'updated_at')


class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    created_by_avatar = serializers.ImageField(source='created_by.avatar', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_to_avatar = serializers.ImageField(source='assigned_to.avatar', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.username', read_only=True)
    supervisor_avatar = serializers.ImageField(source='supervisor.avatar', read_only=True)
    task_type_name = serializers.CharField(source='task_type.name', read_only=True)
    task_type_color = serializers.CharField(source='task_type.color', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    images = TaskImageSerializer(many=True, read_only=True)
    comments_count = serializers.ReadOnlyField()
    evaluations_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'task_type', 'task_type_name', 'task_type_color',
                 'created_by', 'created_by_name', 'created_by_avatar', 'assigned_to', 
                 'assigned_to_name', 'assigned_to_avatar', 'supervisor', 'supervisor_name', 
                 'supervisor_avatar', 'team', 'team_name', 'status', 'priority', 'due_date',
                 'start_date', 'estimated_hours', 'actual_hours', 'created_at', 'updated_at',
                 'completed_at', 'images', 'comments_count', 'evaluations_count', 'average_rating',
                 'is_overdue', 'progress_percentage', 'duration_days')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_evaluations_count(self, obj):
        return obj.evaluations.count()
    
    def get_average_rating(self, obj):
        evaluations = obj.evaluations.all()
        if evaluations:
            ratings = [e.rating for e in evaluations]
            return sum(ratings) / len(ratings)
        return None


class TaskHistorySerializer(serializers.ModelSerializer):
    """Serializer لسجل المهام"""
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    changed_by_avatar = serializers.ImageField(source='changed_by.avatar', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = TaskHistory
        fields = ('id', 'task', 'task_title', 'action', 'action_display', 'changed_by',
                 'changed_by_name', 'changed_by_avatar', 'old_value', 'new_value', 
                 'field_name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')


class TaskDetailSerializer(TaskSerializer):
    """Serializer مفصل للمهمة مع التعليقات والتقييمات"""
    comments = TaskCommentSerializer(many=True, read_only=True)
    evaluations = TaskEvaluationSerializer(many=True, read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    status_change_count = serializers.SerializerMethodField()
    completion_reopen_count = serializers.SerializerMethodField()
    
    def get_status_change_count(self, obj):
        """عدد مرات تغيير الحالة من مكتمل إلى غير مكتمل"""
        return obj.history.filter(
            action='status_changed',
            old_value__icontains='completed',
            new_value__icontains='completed',
            new_value__in=['pending', 'in_progress', 'on_hold']
        ).count()
    
    def get_completion_reopen_count(self, obj):
        """عدد مرات تغيير المهمة من مكتملة إلى غير مكتملة"""
        return obj.history.filter(
            action__in=['completed', 'reopened']
        ).count()
