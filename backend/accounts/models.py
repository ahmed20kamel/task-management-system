from django.contrib.auth.models import AbstractUser
from django.db import models


class Team(models.Model):
    """فريق العمل"""
    name = models.CharField(max_length=100, unique=True, verbose_name='اسم الفريق')
    description = models.TextField(blank=True, null=True, verbose_name='الوصف')
    leader = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='led_teams', verbose_name='قائد الفريق')
    created_by = models.ForeignKey('User', on_delete=models.CASCADE, related_name='created_teams', 
                                   verbose_name='أنشأ بواسطة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')
    
    class Meta:
        verbose_name = 'فريق'
        verbose_name_plural = 'الفرق'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'مدير'),
        ('supervisor', 'مشرف'),
        ('employee', 'موظف'),
    ]
    
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='employee', verbose_name='الدور')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='الهاتف')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='الصورة الشخصية')
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='supervised_employees', verbose_name='المشرف')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='members', verbose_name='الفريق')
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name='المنصب')
    bio = models.TextField(blank=True, null=True, verbose_name='نبذة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')
    
    class Meta:
        verbose_name = 'مستخدم'
        verbose_name_plural = 'المستخدمون'
    
    def __str__(self):
        return self.username
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_supervisor(self):
        return self.role == 'supervisor'
    
    @property
    def is_employee(self):
        return self.role == 'employee'
    
    @property
    def average_rating(self):
        """متوسط تقييم الموظف"""
        from tasks.models import TaskEvaluation
        evaluations = TaskEvaluation.objects.filter(
            task__assigned_to=self
        ).values_list('rating', flat=True)
        if evaluations:
            return sum(evaluations) / len(evaluations)
        return 0
    
    @property
    def total_tasks_completed(self):
        """عدد المهام المكتملة"""
        return self.assigned_tasks.filter(status='completed').count()
    
    @property
    def total_tasks_pending(self):
        """عدد المهام قيد الانتظار"""
        return self.assigned_tasks.filter(status='pending').count()

