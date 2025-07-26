from django.urls import path
from .views import (
    RegisterView, 
    AdminLoginView, 
    AdminUserListView, 
    AdminUserCreateView, 
    AdminUserDeleteView, 
    admin_seed_stocks
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin endpoints
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/create/', AdminUserCreateView.as_view(), name='admin_create_user'),
    path('admin/users/<int:pk>/', AdminUserDeleteView.as_view(), name='admin_delete_user'),
    path('admin/seed-stocks/', admin_seed_stocks, name='admin_seed_stocks'),
]
