# students/models.py
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import uuid


User = get_user_model()

class ReportTask(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    REPORT_TYPES = [
        ('performance', 'Academic Performance'),
        ('endorsement', 'Peer Endorsement'),
        ('comprehensive', 'Comprehensive Report'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.CharField(max_length=100)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='comprehensive')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)
    title = models.CharField(max_length=255, blank=True)
    message = models.TextField(blank=True)
    file_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    result_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = 'report_tasks'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.report_type} report for {self.student_id} - {self.status}"

class StudentProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    average_endorsement_score = models.FloatField(default=0.0)
    bio = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Course(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    credits = models.IntegerField(default=3)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Semester(models.Model):
    name = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = ['name', 'academic_year']

    def __str__(self):
        return f"{self.name} {self.academic_year}"


class Grade(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_grades'  # Changed to avoid conflicts
    )
    semester = models.ForeignKey(
        Semester, 
        on_delete=models.CASCADE, 
        related_name='grades'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    grade_value = models.FloatField()
    grade_letter = models.CharField(max_length=2, blank=True)
    credits_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'semester', 'course']

    def __str__(self):
        return f"{self.student.username} - {self.course.name}: {self.grade_value}"

    def save(self, *args, **kwargs):
        # Auto-calculate grade letter
        if self.grade_value >= 90:
            self.grade_letter = 'A'
        elif self.grade_value >= 80:
            self.grade_letter = 'B'
        elif self.grade_value >= 70:
            self.grade_letter = 'C'
        elif self.grade_value >= 60:
            self.grade_letter = 'D'
        else:
            self.grade_letter = 'F'
        super().save(*args, **kwargs)


class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('academic', 'Academic'),
        ('sports', 'Sports'),
        ('arts', 'Arts'),
        ('leadership', 'Leadership'),
        ('other', 'Other'),
    ]

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="student_achievements"  # Changed to avoid conflicts
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES, default='academic')
    date_achieved = models.DateField()
    progress = models.IntegerField(default=100)
    is_public = models.BooleanField(default=True)
    evidence_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.title}"


class Skill(models.Model):
    SKILL_CATEGORIES = [
        ('technical', 'Technical'),
        ('soft', 'Soft Skills'),
        ('language', 'Language'),
        ('other', 'Other'),
    ]

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_skills'  # Changed to avoid conflicts
    )
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=SKILL_CATEGORIES, default='technical')
    proficiency_level = models.IntegerField(
        choices=[(i, f'Level {i}') for i in range(1, 6)],
        default=3
    )
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['owner', 'name']

    def __str__(self):
        return f"{self.owner.username} - {self.name}"


class Project(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_projects'  # Changed to avoid conflicts
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    technologies_used = models.TextField(help_text="Comma-separated list of technologies")
    project_url = models.URLField(blank=True, null=True)
    repository_url = models.URLField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_ongoing = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.owner.username} - {self.name}"


class PortfolioItem(models.Model):
    ITEM_TYPES = [
        ('document', 'Document'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('code', 'Code Repository'),
        ('certificate', 'Certificate'),
    ]

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_portfolio_items'  # Changed to avoid conflicts
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES, default='document')
    file = models.FileField(upload_to='portfolio/%Y/%m/%d/', blank=True, null=True)
    external_url = models.URLField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.owner.username} - {self.title}"


class Endorsement(models.Model):
    endorser = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='given_endorsements'
    )
    target = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_endorsements'
    )
    skill = models.ForeignKey(
        Skill, 
        on_delete=models.CASCADE, 
        related_name='endorsements',
        blank=True, 
        null=True
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='endorsements',
        blank=True,
        null=True
    )
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['endorser', 'target', 'skill']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.endorser.username} → {self.target.username}: {self.rating} stars"

    def clean(self):
        if self.endorser == self.target:
            raise ValidationError("You cannot endorse yourself.")


class Report(models.Model):
    REPORT_TYPES = [
        ('performance', 'Performance Report'),
        ('endorsement', 'Endorsement Analytics'),
        ('comprehensive', 'Comprehensive Report'),
        ('transcript', 'Academic Transcript'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='performance')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file = models.FileField(upload_to='reports/%Y/%m/%d/', null=True, blank=True)
    file_url = models.URLField(blank=True, null=True)
    parameters = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_reports'
    )
    created_for = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_reports',  # Changed to avoid conflicts
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.created_for:
            self.created_for = self.created_by
        super().save(*args, **kwargs)


class GPARecord(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_gpa_records'  # Changed to unique name
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='gpa_records'
    )
    gpa = models.FloatField()
    cgpa = models.FloatField()
    total_credits = models.IntegerField(default=0)
    completed_credits = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'semester']
        ordering = ['-semester__start_date']

    def __str__(self):
        return f"{self.student.username} - {self.semester.name}: GPA {self.gpa}"


class StudentEnrollment(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_enrollments'  # Changed to avoid conflicts
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    enrollment_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['student', 'course', 'semester']
        ordering = ['-semester__start_date']

    def __str__(self):
        return f"{self.student.username} - {self.course.name} ({self.semester.name})"