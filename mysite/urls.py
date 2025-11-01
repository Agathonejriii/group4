"""
mysite URL Configuration - Serving Vite React Frontend
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # API endpoints
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/students/', include('students.urls')),
]

# Serve React frontend - Catch-all for all other routes
# WhiteNoise will automatically handle static files including assets/
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]