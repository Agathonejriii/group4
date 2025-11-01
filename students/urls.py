from rest_framework import routers
from django.urls import path, include
from .views import (
    AchievementViewSet, SkillViewSet, ProjectViewSet, 
    PortfolioItemViewSet, EndorsementViewSet, CourseViewSet, 
    SemesterViewSet, GradeViewSet, DashboardView,
    GenerateReportView, ReportStatusView, StudentReportsListView, 
    DownloadReportView
)
from .views import DownloadReportView, PeerStudentsView
# Create the router - FIX: Import DefaultRouter from rest_framework.routers
from rest_framework.routers import DefaultRouter
router = DefaultRouter()

# Register all your viewsets
router.register(r'courses', CourseViewSet)
router.register(r'semesters', SemesterViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'portfolio', PortfolioItemViewSet)
router.register(r'endorsements', EndorsementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Student Reports endpoints - these will be under /api/students/
    path('students/peers/', PeerStudentsView.as_view(), name='peer-students'),
    path('students/generate-report/', GenerateReportView.as_view(), name='generate-report'),
    path('students/report-status/<uuid:task_id>/', ReportStatusView.as_view(), name='report-status'),
    path('students/reports/', StudentReportsListView.as_view(), name='student-reports'),
    path('students/reports/<uuid:task_id>/download/', DownloadReportView.as_view(), name='download-report')
]