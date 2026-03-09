from django.contrib import admin
from .models import Task, TaskType, TaskImage, TaskComment, TaskEvaluation, TaskHistory


@admin.register(TaskType)
class TaskTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'tasks_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
    
    def tasks_count(self, obj):
        return obj.tasks.count()
    tasks_count.short_description = 'عدد المهام'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'task_type', 'created_by', 'assigned_to', 'supervisor', 
                   'team', 'status', 'priority', 'due_date', 'is_overdue', 'created_at')
    list_filter = ('status', 'priority', 'task_type', 'team', 'created_at', 'due_date')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at', 'completed_at', 'is_overdue', 
                      'progress_percentage', 'comments_count')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('معلومات أساسية', {
            'fields': ('title', 'description', 'task_type', 'status', 'priority')
        }),
        ('التعيين', {
            'fields': ('created_by', 'assigned_to', 'supervisor', 'team')
        }),
        ('التواريخ', {
            'fields': ('start_date', 'due_date', 'estimated_hours', 'actual_hours')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at', 'completed_at', 'is_overdue',
                      'progress_percentage', 'comments_count')
        }),
    )


@admin.register(TaskImage)
class TaskImageAdmin(admin.ModelAdmin):
    list_display = ('task', 'caption', 'uploaded_by', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('task__title', 'caption')
    readonly_fields = ('uploaded_at',)


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'user', 'parent', 'created_at', 'edited')
    list_filter = ('created_at', 'edited')
    search_fields = ('task__title', 'user__username', 'content')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(TaskEvaluation)
class TaskEvaluationAdmin(admin.ModelAdmin):
    list_display = ('task', 'evaluated_employee', 'evaluated_by', 'criteria', 'rating', 
                   'evaluated_at')
    list_filter = ('criteria', 'rating', 'evaluated_at')
    search_fields = ('task__title', 'evaluated_employee__username', 'evaluated_by__username')
    readonly_fields = ('evaluated_at', 'updated_at')
    date_hierarchy = 'evaluated_at'

@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ('task', 'action', 'changed_by', 'field_name', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('task__title', 'description', 'changed_by__username')
    readonly_fields = ('created_at',)
    raw_id_fields = ('task', 'changed_by')
    date_hierarchy = 'created_at'
