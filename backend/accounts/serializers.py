from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Team


class TeamSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.username', read_only=True)
    leader_avatar = serializers.ImageField(source='leader.avatar', read_only=True)
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ('id', 'name', 'description', 'leader', 'leader_name', 'leader_avatar', 
                 'created_by', 'members_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_members_count(self, obj):
        return obj.members.count()


class UserSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.username', read_only=True)
    supervisor_avatar = serializers.ImageField(source='supervisor.avatar', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    team_id = serializers.IntegerField(source='team.id', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    total_tasks_completed = serializers.ReadOnlyField()
    total_tasks_pending = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 
                 'avatar', 'avatar_url', 'supervisor', 'supervisor_name', 'supervisor_avatar',
                 'team', 'team_name', 'team_id', 'position', 'bio', 'average_rating',
                 'total_tasks_completed', 'total_tasks_pending', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login')
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 
                 'last_name', 'role', 'phone', 'supervisor', 'team', 'position', 'bio')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "كلمات المرور غير متطابقة"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('اسم المستخدم أو كلمة المرور غير صحيحة')
            if not user.is_active:
                raise serializers.ValidationError('الحساب غير مفعّل')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('يجب إدخال اسم المستخدم وكلمة المرور')
        
        return attrs
