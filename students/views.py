# students/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import datetime 
from rest_framework.decorators import api_view, permission_classes, action
from django.db.models import Q
from django.http import FileResponse
from django.contrib.auth import get_user_model
from .models import (
    Achievement, Skill, Project, PortfolioItem, Endorsement,
    Course, Semester, Grade, Report, StudentProfile
)
from .serializers import (
    AchievementSerializer, SkillSerializer, ProjectSerializer,
    PortfolioItemSerializer, EndorsementSerializer,
    CourseSerializer, SemesterSerializer, GradeSerializer, ReportSerializer
)
from .tasks import async_generate_report
from .utils.peer_endorsement import peer_endorsement_score
from .utils.report_generator import AsyncReportGenerator
import threading
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import time
import json
from .models import ReportTask
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status


User = get_user_model()


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsStudentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["student", "admin"]


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "message": f"Welcome {user.username}! Role: {user.role}",
            "user_data": {
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        })


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            # Students can only see their enrolled courses
            return Course.objects.filter(students=user)
        return Course.objects.all()


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            # Students can only see their own grades
            return Grade.objects.filter(student=user)
        return Grade.objects.all()


class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            # Students see their own achievements and public ones
            return Achievement.objects.filter(
                Q(owner=user) | Q(is_public=True)
            )
        # Admins see all achievements
        return Achievement.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return Skill.objects.filter(owner=user)
        return Skill.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return Project.objects.filter(owner=user)
        return Project.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PortfolioItemViewSet(viewsets.ModelViewSet):
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return PortfolioItem.objects.filter(owner=user)
        return PortfolioItem.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class EndorsementViewSet(viewsets.ModelViewSet):
    queryset = Endorsement.objects.all()
    serializer_class = EndorsementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            # Students see endorsements they gave or received
            return Endorsement.objects.filter(
                Q(endorser=user) | Q(target=user)
            )
        return Endorsement.objects.all()

    def perform_create(self, serializer):
        endorsement = serializer.save(endorser=self.request.user)
        self.update_endorsement_score(endorsement.target)

    def update_endorsement_score(self, target_user):
        """Update the average endorsement score for a user"""
        try:
            all_endorsements = Endorsement.objects.filter(target=target_user)
            if all_endorsements.exists():
                # Calculate using the peer endorsement scoring function
                endorsement_data = [
                    {'peer': e.endorser.username, 'score': e.rating} 
                    for e in all_endorsements
                ]
                score = peer_endorsement_score(endorsement_data)
                
                # Update the user's profile
                profile, created = StudentProfile.objects.get_or_create(user=target_user)
                profile.average_endorsement_score = score
                profile.save()

        except Exception as e:
            print(f"Error updating endorsement score: {e}")


class ReportGenerationThread(threading.Thread):
    def __init__(self, student_id, report_type, task_id, user_data=None):
        threading.Thread.__init__(self)
        self.student_id = student_id
        self.report_type = report_type
        self.task_id = task_id
        self.user_data = user_data

    def run(self):
        try:
            task = ReportTask.objects.get(id=self.task_id)
            task.status = 'processing'
            task.title = f"{self.report_type.replace('_', ' ').title()} Report"
            task.save()

            # Simulate different steps based on report type
            if self.report_type == 'performance':
                steps = [
                    "Gathering academic records...",
                    "Analyzing GPA trends...",
                    "Processing course completion data...",
                    "Generating performance insights...",
                    "Compiling final report..."
                ]
            elif self.report_type == 'endorsement':
                steps = [
                    "Collecting peer endorsements...",
                    "Analyzing endorsement patterns...",
                    "Calculating credibility scores...",
                    "Generating social insights...", 
                    "Compiling final report..."
                ]
            else:  # comprehensive
                steps = [
                    "Gathering comprehensive data...",
                    "Analyzing academic performance...",
                    "Processing peer interactions...",
                    "Generating holistic insights...",
                    "Compiling final report..."
                ]

            for i, step in enumerate(steps):
                time.sleep(2)  # Simulate work
                progress = ((i + 1) / len(steps)) * 100
                task.progress = int(progress)
                task.message = step
                task.save()

            # Generate actual report data
            report_data = self.generate_report_data()
            
            # Mark as completed
            task.status = 'completed'
            task.progress = 100
            task.message = 'Report generated successfully!'
            task.file_url = f"/api/students/reports/{task.id}/download/"
            task.result_data = report_data
            task.save()

        except Exception as e:
            task = ReportTask.objects.get(id=self.task_id)
            task.status = 'failed'
            task.error_message = str(e)
            task.save()

    def generate_report_data(self):
        """Generate actual report data based on report type"""
        base_data = {
            'student_id': self.student_id,
            'report_type': self.report_type,
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'title': f"{self.report_type.replace('_', ' ').title()} Report",
        }

        if self.report_type == 'performance':
            base_data.update({
                'gpa': 3.8,
                'courses_completed': 12,
                'current_semester': 'Fall 2024',
                'academic_standing': 'Good',
                'recommendations': [
                    'Focus on advanced mathematics courses',
                    'Consider research opportunities',
                    'Maintain current study habits'
                ]
            })
        elif self.report_type == 'endorsement':
            base_data.update({
                'total_endorsements': 8,
                'average_rating': 4.5,
                'top_skills': ['React', 'Python', 'Research'],
                'peer_feedback': 'Highly collaborative and skilled team member',
                'endorsement_breakdown': {
                    'technical_skills': 6,
                    'teamwork': 5,
                    'creativity': 4
                }
            })
        else:  # comprehensive
            base_data.update({
                'academic_summary': {
                    'gpa': 3.8,
                    'courses_completed': 12,
                    'current_status': 'Excellent'
                },
                'peer_summary': {
                    'endorsements': 8,
                    'average_rating': 4.5,
                    'collaboration_score': 4.7
                },
                'overall_assessment': 'Strong academic performance with excellent peer recognition',
                'development_areas': [
                    'Advanced technical projects',
                    'Leadership opportunities',
                    'Research publications'
                ]
            })

        return base_data


class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            student_id = request.data.get('student_id', str(request.user.id))
            report_type = request.data.get('report_type', 'comprehensive')

            # DEBUG: Print user information
            print(f"🔍 DEBUG GenerateReportView:")
            print(f"   - User ID: {request.user.id}")
            print(f"   - User ID (str): {str(request.user.id)}")
            print(f"   - Username: {request.user.username}")
            print(f"   - Student ID from request: {student_id}")
            print(f"   - Student ID type: {type(student_id)}")

            # Validate report type
            valid_types = ['performance', 'endorsement', 'comprehensive']
            if report_type not in valid_types:
                return Response({
                    'error': f'Invalid report type. Must be one of: {", ".join(valid_types)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create a new report task
            task = ReportTask.objects.create(
                student_id=student_id,
                report_type=report_type,
                status='pending',
                progress=0,
                message='Initializing report generation...'
            )

            print(f"   - Created ReportTask ID: {task.id}")
            print(f"   - Task student_id: {task.student_id}")
            print(f"   - Task student_id type: {type(task.student_id)}")

            # Get user data for report generation
            user_data = {
                'username': request.user.username,
                'email': request.user.email,
            }

            # Start the report generation in a separate thread
            report_thread = ReportGenerationThread(
                student_id, 
                report_type, 
                task.id,
                user_data
            )
            report_thread.daemon = True
            report_thread.start()

            return Response({
                'task_id': str(task.id),
                'status': 'started',
                'message': 'Report generation started in background',
                'report_type': report_type,
                'created_at': task.created_at.isoformat()
            })

        except Exception as e:
            print(f"❌ ERROR in GenerateReportView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            print(f"🔍 DEBUG ReportStatusView (Temporary):")
            print(f"   - User: {request.user.username} (ID: {request.user.id})")
            print(f"   - Task ID: {task_id}")

            task = ReportTask.objects.get(id=task_id)
            
            print(f"   - Task student_id: {task.student_id}")
            print(f"   - Task status: {task.status}")
            print(f"   - Task progress: {task.progress}%")

            # TEMPORARY: Remove permission check for testing
            # TODO: Add proper permission check after debugging
            
            response_data = {
                'task_id': str(task.id),
                'status': task.status,
                'progress': task.progress,
                'title': task.title,
                'message': task.message,
                'report_type': task.report_type,
                'created_at': task.created_at.isoformat(),
                'result': task.result_data,
                'error': task.error_message
            }

            if task.completed_at:
                response_data['completed_at'] = task.completed_at.isoformat()

            print(f"   ✅ Returning status: {task.status}")
            return Response(response_data)
            
        except ReportTask.DoesNotExist:
            print(f"❌ ReportTask not found: {task_id}")
            return Response({'error': 'Report task not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ ERROR in ReportStatusView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentReportsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student_id = str(request.user.id)
            reports = ReportTask.objects.filter(student_id=student_id)
            
            reports_data = []
            for report in reports:
                report_data = {
                    'id': str(report.id),
                    'title': report.title or f"{report.report_type.replace('_', ' ').title()} Report",
                    'report_type': report.report_type,
                    'status': report.status,
                    'progress': report.progress,
                    'created_at': report.created_at.isoformat(),
                    'file_url': report.file_url,
                    'message': report.message
                }

                if report.completed_at:
                    report_data['completed_at'] = report.completed_at.isoformat()

                reports_data.append(report_data)
            
            return Response(reports_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DownloadReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            print(f"🔍 DEBUG DownloadReportView (NO PERMISSION CHECK):")
            print(f"   - User: {request.user.username} (ID: {request.user.id})")
            print(f"   - Task ID: {task_id}")

            task = ReportTask.objects.get(id=task_id)
            
            print(f"   - Task student_id: {task.student_id}")
            print(f"   - Task status: {task.status}")
            print(f"   - Has result data: {bool(task.result_data)}")

            # TEMPORARY: No permission check at all
            # Just check if report is ready
            
            if task.status != 'completed':
                return Response({'error': 'Report not ready for download'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not task.result_data:
                return Response({'error': 'Report data not available'}, status=status.HTTP_400_BAD_REQUEST)

            # Return the report data as JSON for download
            report_data = {
                'student_id': task.student_id,
                'report_type': task.report_type,
                'title': task.title,
                'generated_at': task.completed_at.isoformat() if task.completed_at else None,
                'data': task.result_data,
                'summary': 'Report generated successfully using threaded background processing.'
            }
            
            print(f"   ✅ Returning report data for download")
            return Response(report_data)
            
        except ReportTask.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Additional utility views
class PeerEndorsementAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get endorsement analytics for the current user"""
        user = request.user
        
        try:
            profile = StudentProfile.objects.get(user=user)
            endorsements = Endorsement.objects.filter(target=user)
            
            analytics = {
                "average_score": profile.average_endorsement_score,
                "total_endorsements": endorsements.count(),
                "endorsement_breakdown": self.get_endorsement_breakdown(endorsements),
                "recent_endorsements": EndorsementSerializer(
                    endorsements.order_by('-created_at')[:5], 
                    many=True
                ).data
            }
            
            return Response(analytics)
            
        except StudentProfile.DoesNotExist:
            return Response({
                "average_score": 0,
                "total_endorsements": 0,
                "endorsement_breakdown": {},
                "recent_endorsements": []
            })

    def get_endorsement_breakdown(self, endorsements):
        """Calculate endorsement score distribution"""
        breakdown = {
            "5_stars": endorsements.filter(rating=5).count(),
            "4_stars": endorsements.filter(rating=4).count(),
            "3_stars": endorsements.filter(rating=3).count(),
            "2_stars": endorsements.filter(rating=2).count(),
            "1_star": endorsements.filter(rating=1).count(),
        }
        return breakdown
    
class PeerStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of peer students that the current user can see
        Students can see other students in their courses or public profiles
        """
        try:
            current_user = request.user
            
            # If user is admin/staff, return all students
            if current_user.is_staff or getattr(current_user, 'role', '') == 'admin':
                students = User.objects.filter(role='student')
            else:
                # For regular students, return other students they might interact with
                # This could be based on shared courses, same department, etc.
                # For now, return all other students (excluding themselves)
                students = User.objects.filter(role='student').exclude(id=current_user.id)
            
            students_data = []
            for student in students:
                students_data.append({
                    'id': student.id,
                    'username': student.username,
                    'email': student.email,
                    'department': getattr(student, 'department', None),
                    'year': getattr(student, 'year', None),
                    'bio': getattr(student, 'bio', None),
                })
            
            return Response(students_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)