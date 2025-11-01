from rest_framework import serializers
from .models import Course, Semester, Grade
from .models import Achievement, Skill, Project, PortfolioItem, Endorsement, Course, Semester, Grade, Report, StudentProfile


class ReportSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_for_username = serializers.CharField(source='created_for.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'report_type', 'report_type_display', 'status', 'status_display',
            'file_url', 'created_by', 'created_by_username', 'created_for', 'created_for_username',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'completed_at', 'status']


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = StudentProfile
        fields = ['id', 'username', 'email', 'average_endorsement_score']


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class GradeSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), source='course', write_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'course', 'course_id', 'grade']

class SemesterSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)

    class Meta:
        model = Semester
        fields = ['id', 'name', 'grades']

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class PortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItem
        fields = '__all__'

class EndorsementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endorsement
        fields = '__all__'
