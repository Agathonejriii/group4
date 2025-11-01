from rest_framework import routers
from django.urls import path, include
from .views import (
    AchievementViewSet, SkillViewSet, ProjectViewSet, 
    PortfolioItemViewSet, EndorsementViewSet, CourseViewSet, 
    SemesterViewSet, GradeViewSet, DashboardView,
    GenerateReportView, ReportStatusView, StudentReportsListView, 
    DownloadReportView, PeerStudentsView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'semesters', SemesterViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'portfolio', PortfolioItemViewSet)
router.register(r'endorsements', EndorsementViewSet)

urlpatterns = [
    # REMOVED: path('', include(router.urls)) - THIS WAS CAUSING THE REDIRECT!
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('peers/', PeerStudentsView.as_view(), name='peer-students'),
    path('generate-report/', GenerateReportView.as_view(), name='generate-report'),
    path('report-status/<uuid:task_id>/', ReportStatusView.as_view(), name='report-status'),
    path('reports/', StudentReportsListView.as_view(), name='student-reports'),
    path('reports/<uuid:task_id>/download/', DownloadReportView.as_view(), name='download-report'),
]

# Add router URLs with specific prefixes
urlpatterns += [
    path('courses/', include(router.urls)),  # Or include all router URLs
]