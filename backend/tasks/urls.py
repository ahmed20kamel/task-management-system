from django.urls import path
from . import views

urlpatterns = [
    # Task Types
    path('types/', views.task_type_list_create, name='task_type_list_create'),
    
    # Tasks
    path('', views.task_list_create, name='task_list_create'),
    path('<int:pk>/', views.task_detail, name='task_detail'),
    path('<int:task_id>/history/', views.task_history_list, name='task_history_list'),
    path('statistics/', views.task_statistics, name='task_statistics'),
    
    # Task Images
    path('<int:task_id>/images/', views.task_image_upload, name='task_image_upload'),
    
    # Task Comments
    path('<int:task_id>/comments/', views.task_comment_list_create, name='task_comment_list_create'),
    path('comments/<int:comment_id>/', views.task_comment_detail, name='task_comment_detail'),
    
    # Evaluations
    path('evaluations/', views.evaluation_list_create, name='evaluation_list_create'),
    path('employees/<int:employee_id>/ratings/', views.employee_ratings, name='employee_ratings'),
]
