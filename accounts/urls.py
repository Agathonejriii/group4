from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    MeView,
    StudentsListView,
    GPARecordListCreateView,
    AllUsersListView,
    GPARecordViewSet,
)

# Create DRF router and register viewsets
router = DefaultRouter()
router.register(r'gpa-records', GPARecordViewSet, basename='gpa-records')

# Regular path-based URLs
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('students/', StudentsListView.as_view(), name='students-list'),
    path('gpa-records-list/', GPARecordListCreateView.as_view(), name='gpa-records-list'),
    path('all-users/', AllUsersListView.as_view(), name='all-users'),
]

# Include router URLs at the end
urlpatterns += router.urls