"""
mysite URL Configuration - Serving Vite React Frontend
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # API endpoints
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/students/', include('students.urls')),
]

# Explicitly serve assets from Vite build
urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$', serve, {
        'document_root': settings.STATIC_ROOT / 'assets',
        'show_indexes': settings.DEBUG,
    }),
]

# Serve React frontend - Catch-all for all other routes
urlpatterns += [
    re_path(r'^(?!admin/|api/|assets/).*$', TemplateView.as_view(template_name='index.html')),
]