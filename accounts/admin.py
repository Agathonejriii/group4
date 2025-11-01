from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile, GPARecord


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Role & Permissions', {'fields': ('role', 'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'role', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('username', 'email', 'role')
    ordering = ('username',)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_name')
    search_fields = ('user__username', 'display_name')


@admin.register(GPARecord)
class GPARecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'semester', 'gpa', 'created_at')
    search_fields = ('student__username', 'semester')
    list_filter = ('semester', 'created_at')
    ordering = ('-created_at',)
