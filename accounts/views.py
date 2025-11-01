from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .serializers import RegisterSerializer, LoginSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, viewsets
from .models import GPARecord
from .serializers import GPARecordSerializer
from .models import CustomUser
from rest_framework import viewsets, permissions


User = get_user_model()


class AllUsersListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only allow admins to view all users
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=403)
        
        users = CustomUser.objects.all()
        data = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'department': user.department,
            'year': user.year,
            'bio': user.bio,
        } for user in users]
        
        return Response(data)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "User created successfully",
                "username": user.username,
                "role": user.role,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "Login successful",
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "department": getattr(user, "department", ""),
            "year": getattr(user, "year", ""),
            "bio": getattr(user, "bio", ""),
        })

    def put(self, request):
        user = request.user
        data = request.data

        # Update fields safely
        user.username = data.get("name", user.username)
        user.email = data.get("email", user.email)
        # Optional: add extra fields to CustomUser model if not already
        if hasattr(user, "department"):
            user.department = data.get("department", user.department)
        if hasattr(user, "year"):
            user.year = data.get("year", user.year)
        if hasattr(user, "bio"):
            user.bio = data.get("bio", user.bio)

        user.save()
        return Response({
            "message": "Profile updated successfully",
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "department": getattr(user, "department", ""),
            "year": getattr(user, "year", ""),
            "bio": getattr(user, "bio", ""),
        }, status=status.HTTP_200_OK)

class StudentsListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        
        if request.user.role not in ['admin', 'lecturer']:
            return Response(
                {"detail": "You don't have permission to view students list."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        users = User.objects.all().values('id', 'username', 'email', 'role')
        return Response(list(users), status=status.HTTP_200_OK)


class GPARecordListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GPARecordSerializer

    def get_queryset(self):
        user = self.request.user
        # Students only see their own GPA records
        if user.role == 'student':
            return GPARecord.objects.filter(student=user)
        # Admins and lecturers can view all
        return GPARecord.objects.all()

    def perform_create(self, serializer):
        # Automatically attach logged-in user as the student
        serializer.save(student=self.request.user)

class GPARecordViewSet(viewsets.ModelViewSet):
    serializer_class = GPARecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = GPARecord.objects.all().order_by('-created_at')
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student__id=student_id)
        return queryset