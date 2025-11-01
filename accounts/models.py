from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model



class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100, blank=True, null=True)
    year = models.CharField(max_length=50, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100, blank=True, null=True)

class GPARecord(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="gpa_records")
    semester = models.CharField(max_length=100)
    subjects = models.JSONField()  # [{name, marks, credits, grade}]
    gpa = models.FloatField()
    cgpa = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.semester}"
