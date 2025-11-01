"""
mysite URL Configuration - Serving React Frontend + Django Backend
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # Your API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('students.urls')),
]

# Serve static files (including React assets)
if settings.DEBUG:
    # Serve files from staticfiles/assets/
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', static_serve, {'document_root': settings.STATIC_ROOT / 'assets'}),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all pattern: serve React app (MUST be last!)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]