from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class TaskType(models.Model):
    """نوع المهمة"""
    name = models.CharField(max_length=100, unique=True, verbose_name='اسم النوع')
    description = models.TextField(blank=True, null=True, verbose_name='الوصف')
    color = models.CharField(max_length=7, default='#1976d2', verbose_name='اللون')
    icon = models.CharField(max_length=50, blank=True, null=True, verbose_name='الأيقونة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    
    class Meta:
        verbose_name = 'نوع المهمة'
        verbose_name_plural = 'أنواع المهام'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('in_progress', 'قيد التنفيذ'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
        ('on_hold', 'معلّق'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'منخفض'),
        ('medium', 'متوسط'),
        ('high', 'عالي'),
        ('urgent', 'عاجل'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='عنوان المهمة')
    description = models.TextField(verbose_name='الوصف')
    task_type = models.ForeignKey(TaskType, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='tasks', verbose_name='نوع المهمة')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks', verbose_name='أنشأ بواسطة')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='assigned_tasks', verbose_name='مكلف إلى')
    supervisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='supervised_tasks', verbose_name='المشرف')
    team = models.ForeignKey('accounts.Team', on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='tasks', verbose_name='الفريق')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='الحالة')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='الأولوية')
    due_date = models.DateTimeField(verbose_name='تاريخ الانتهاء')
    start_date = models.DateTimeField(null=True, blank=True, verbose_name='تاريخ البدء')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاريخ الإتمام')
    estimated_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, 
                                         verbose_name='الساعات المقدرة')
    actual_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, 
                                      verbose_name='الساعات الفعلية')
    
    class Meta:
        verbose_name = 'مهمة'
        verbose_name_plural = 'المهام'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        return timezone.now() > self.due_date and self.status not in ['completed', 'cancelled']
    
    @property
    def duration_days(self):
        if self.due_date:
            delta = self.due_date - self.created_at
            return delta.days
        return None
    
    @property
    def progress_percentage(self):
        """نسبة التقدم"""
        if self.status == 'completed':
            return 100
        elif self.status == 'in_progress':
            return 50
        elif self.status == 'pending':
            return 0
        return 0
    
    @property
    def comments_count(self):
        """عدد التعليقات"""
        return self.comments.count()


class TaskImage(models.Model):
    """صور المهمة"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='images', verbose_name='المهمة')
    image = models.ImageField(upload_to='task_images/', verbose_name='الصورة')
    caption = models.CharField(max_length=200, blank=True, null=True, verbose_name='التعليق')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='رفع بواسطة')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الرفع')
    
    class Meta:
        verbose_name = 'صورة المهمة'
        verbose_name_plural = 'صور المهام'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f'صورة {self.task.title}'


class TaskComment(models.Model):
    """تعليقات/دردشة المهمة"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments', verbose_name='المهمة')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments', verbose_name='المستخدم')
    content = models.TextField(verbose_name='المحتوى')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                              related_name='replies', verbose_name='الرد على')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')
    edited = models.BooleanField(default=False, verbose_name='تم التعديل')
    
    class Meta:
        verbose_name = 'تعليق المهمة'
        verbose_name_plural = 'تعليقات المهام'
        ordering = ['created_at']
    
    def __str__(self):
        return f'تعليق من {self.user.username} على {self.task.title}'
    
    @property
    def replies_count(self):
        """عدد الردود"""
        return self.replies.count()


class TaskEvaluation(models.Model):
    RATING_CHOICES = [
        (1, 'ضعيف جداً'),
        (2, 'ضعيف'),
        (3, 'متوسط'),
        (4, 'جيد'),
        (5, 'ممتاز'),
    ]
    
    CRITERIA_CHOICES = [
        ('quality', 'الجودة'),
        ('speed', 'السرعة'),
        ('communication', 'التواصل'),
        ('problem_solving', 'حل المشاكل'),
        ('teamwork', 'العمل الجماعي'),
        ('overall', 'التقييم العام'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='evaluations', verbose_name='المهمة')
    rating = models.IntegerField(choices=RATING_CHOICES, verbose_name='التقييم')
    criteria = models.CharField(max_length=20, choices=CRITERIA_CHOICES, default='overall', verbose_name='المعيار')
    feedback = models.TextField(blank=True, null=True, verbose_name='ملاحظات')
    evaluated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_evaluations', verbose_name='قيم بواسطة')
    evaluated_employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_evaluations', 
                                          null=True, blank=True, verbose_name='الموظف المقيم')
    evaluated_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ التقييم')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')
    
    class Meta:
        verbose_name = 'تقييم المهمة'
        verbose_name_plural = 'تقييمات المهام'
        ordering = ['-evaluated_at']
    
    def save(self, *args, **kwargs):
        # Auto-set evaluated_employee from task.assigned_to if not set
        if not self.evaluated_employee and self.task and self.task.assigned_to:
            self.evaluated_employee = self.task.assigned_to
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f'تقييم {self.task.title} - {self.get_criteria_display()} - {self.rating}'


class TaskHistory(models.Model):
    """سجل المهام - لتتبع التغييرات"""
    ACTION_CHOICES = [
        ('created', 'تم الإنشاء'),
        ('updated', 'تم التحديث'),
        ('status_changed', 'تم تغيير الحالة'),
        ('assigned', 'تم التعيين'),
        ('unassigned', 'تم إلغاء التعيين'),
        ('completed', 'تم الإتمام'),
        ('reopened', 'تم إعادة الفتح'),
        ('deleted', 'تم الحذف'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history', verbose_name='المهمة')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='الإجراء')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='task_history_actions',
                                   verbose_name='تم التغيير بواسطة')
    old_value = models.TextField(blank=True, null=True, verbose_name='القيمة القديمة')
    new_value = models.TextField(blank=True, null=True, verbose_name='القيمة الجديدة')
    field_name = models.CharField(max_length=50, blank=True, null=True, verbose_name='اسم الحقل')
    description = models.TextField(blank=True, null=True, verbose_name='الوصف')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ التغيير')

    class Meta:
        verbose_name = 'سجل المهمة'
        verbose_name_plural = 'سجلات المهام'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_action_display()} - {self.task.title}'

