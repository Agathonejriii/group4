from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from .models import GPARecord


User = get_user_model()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('student', 'Student'), ('lecturer', 'Lecturer'), ('admin', 'Admin')], required=True)  # Add role field
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user and user.is_active:
                return {"user": user}
        raise serializers.ValidationError("Invalid credentials")
    

class GPARecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = GPARecord
        fields = '__all__'

