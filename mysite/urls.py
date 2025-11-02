"""
mysite URL Configuration - Serving Vite React Frontend
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# API endpoints - These MUST come FIRST
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/students/', include('students.urls')),
]

# Explicitly serve assets from Vite build
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {
            'document_root': settings.STATIC_ROOT / 'assets',
            'show_indexes': True,
        }),
    ]
else:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Serve React frontend - Catch-all MUST be LAST
urlpatterns += [
    re_path(r'^(?!api/).*', TemplateView.as_view(template_name='index.html')),
]