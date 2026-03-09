from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('employees/', views.employee_list, name='employee_list'),
    path('supervisors/', views.supervisor_list, name='supervisor_list'),
    path('teams/', views.team_list_create, name='team_list_create'),
    path('teams/<int:pk>/', views.team_detail, name='team_detail'),
]
