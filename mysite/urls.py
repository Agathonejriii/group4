"""
mysite URL Configuration - Serving React Frontend + Django Backend
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # Your API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('students.urls')),
    
    # API endpoints that should come before catch-all
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve static files in both development and production
urlpatterns += [
    re_path(r'^static/(?P<path>.*)$', static_serve, {'document_root': settings.STATIC_ROOT}),
    re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
]

# Serve React assets specifically
urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$', static_serve, {'document_root': settings.STATIC_ROOT / 'assets'}),
]

# Catch-all pattern: serve React app (ONLY for non-API, non-admin, non-static routes)
# This should be the VERY LAST pattern
# In urls.py - use the staticfiles version
urlpatterns += [
    re_path(r'^(?!admin/|api/|static/|media/|assets/).*$', 
            TemplateView.as_view(template_name='frontend/dist/index.html')),
]