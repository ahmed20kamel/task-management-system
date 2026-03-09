from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.db import transaction
from django.db.models import Q
from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import logging
from .serializers import UserSerializer, UserRegistrationSerializer, LoginSerializer, TeamSerializer
from .models import User, Team

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Registration error: {str(e)}', exc_info=True)
        return Response({
            'error': 'حدث خطأ أثناء التسجيل',
            'detail': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Login error: {str(e)}', exc_info=True)
        return Response({
            'error': 'حدث خطأ أثناء تسجيل الدخول',
            'detail': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    return Response({'message': 'تم تسجيل الخروج بنجاح'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'user': serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """تغيير كلمة المرور"""
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not old_password or not new_password:
        return Response(
            {'error': 'يجب إدخال كلمة المرور الحالية والجديدة'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not request.user.check_password(old_password):
        return Response(
            {'error': 'كلمة المرور الحالية غير صحيحة'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        validate_password(new_password, user=request.user)
    except ValidationError as e:
        return Response(
            {'error': 'كلمة المرور غير صحيحة', 'details': list(e.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    request.user.set_password(new_password)
    request.user.save()
    update_session_auth_hash(request, request.user)

    return Response({'message': 'تم تغيير كلمة المرور بنجاح'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_list(request):
    if request.user.is_employee:
        return Response(
            {'error': 'ليس لديك صلاحية لعرض قائمة الموظفين'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    employees = User.objects.filter(role='employee')
    
    # Supervisors can see their supervised employees
    if request.user.is_supervisor:
        employees = employees.filter(supervisor=request.user)
    
    # Filter by team
    team_id = request.query_params.get('team')
    if team_id:
        employees = employees.filter(team_id=team_id)
    
    serializer = UserSerializer(employees, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def supervisor_list(request):
    """قائمة المشرفين"""
    if request.user.is_employee:
        return Response(
            {'error': 'ليس لديك صلاحية لعرض قائمة المشرفين'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    supervisors = User.objects.filter(role='supervisor')
    serializer = UserSerializer(supervisors, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def team_list_create(request):
    """قائمة الفرق وإنشاء فريق جديد"""
    if request.method == 'GET':
        teams = Team.objects.select_related('leader', 'created_by').prefetch_related('members').all()
        
        # Supervisors can see teams they lead or supervise
        if request.user.is_supervisor:
            teams = teams.filter(Q(leader=request.user) | Q(members__supervisor=request.user)).distinct()
        elif request.user.is_employee:
            teams = teams.filter(members=request.user).distinct()
        
        serializer = TeamSerializer(teams, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not (request.user.is_admin or request.user.is_supervisor):
            return Response(
                {'error': 'فقط المدير أو المشرف يمكنه إنشاء فرق'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TeamSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            team = serializer.save(created_by=request.user)
            return Response(TeamSerializer(team, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def team_detail(request, pk):
    """تفاصيل الفريق وتحديثه وحذفه"""
    try:
        team = Team.objects.select_related('leader', 'created_by').prefetch_related('members').get(pk=pk)
    except Team.DoesNotExist:
        return Response({'error': 'الفريق غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TeamSerializer(team, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        can_edit = (
            request.user.is_admin or
            (request.user.is_supervisor and team.leader == request.user) or
            team.created_by == request.user
        )
        
        if not can_edit:
            return Response(
                {'error': 'ليس لديك صلاحية لتعديل هذا الفريق'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TeamSerializer(team, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(TeamSerializer(team, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not (request.user.is_admin and team.created_by == request.user):
            return Response(
                {'error': 'فقط منشئ الفريق يمكنه حذفه'},
                status=status.HTTP_403_FORBIDDEN
            )
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

