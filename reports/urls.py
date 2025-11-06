# reports/urls.py

from django.urls import path
from . import views


urlpatterns = [
    path('send-report-email/', views.send_report_email, name='send-report-email'),
    path('cloud-upload/', views.cloud_upload, name='cloud-upload'),
    path('oauth2callback/', views.oauth2callback, name='oauth2callback'),
]