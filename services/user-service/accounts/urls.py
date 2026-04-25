from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, CustomTokenObtainPairView, ProfileView

urlpatterns = [
    path("users/auth/register/", RegisterView.as_view(), name="register"),
    path("users/auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("users/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/profile/", ProfileView.as_view(), name="profile"),
]
