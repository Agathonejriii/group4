# reports/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.mail import EmailMessage
import json
import base64
from django.utils import timezone
from django.core.mail import EmailMessage
import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import traceback
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
import pickle
from django.shortcuts import redirect
from django.http import JsonResponse

try:
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    from googleapiclient.errors import HttpError
    GOOGLE_DRIVE_AVAILABLE = True
except ImportError as e:
    print(f"❌ Google Drive dependencies not installed: {e}")
    GOOGLE_DRIVE_AVAILABLE = False

# OAuth 2.0 Scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_google_drive_service(request):
    """
    Get authenticated Google Drive service using OAuth 2.0
    """
    if not GOOGLE_DRIVE_AVAILABLE:
        raise Exception("Google OAuth dependencies not installed")
    
    creds = None
    
    # The file token.pickle stores the user's access and refresh tokens.
    token_path = os.path.join(settings.BASE_DIR, 'token.pickle')
    
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Start OAuth flow
            flow = Flow.from_client_secrets_file(
                'oauth_credentials.json',  # Your OAuth 2.0 credentials
                SCOPES
            )
            flow.redirect_uri = 'http://localhost:8000/oauth2callback/'
            
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true'
            )
            
            # Store state in session for validation
            request.session['oauth_state'] = state
            
            # Redirect to Google's OAuth 2.0 server
            return redirect(authorization_url)
        
        # Save the credentials for the next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
    
    return build('drive', 'v3', credentials=creds)

def oauth2callback(request):
    """
    Handle OAuth 2.0 callback
    """
    try:
        state = request.GET.get('state')
        code = request.GET.get('code')
        
        # Verify state matches
        if state != request.session.get('oauth_state'):
            return JsonResponse({'error': 'Invalid state parameter'}, status=400)
        
        flow = Flow.from_client_secrets_file(
            'oauth_credentials.json',
            SCOPES,
            state=state
        )
        flow.redirect_uri = 'http://localhost:8000/oauth2callback/'
        
        # Exchange authorization code for tokens
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        # Save credentials
        token_path = os.path.join(settings.BASE_DIR, 'token.pickle')
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
        
        # Clear session state
        if 'oauth_state' in request.session:
            del request.session['oauth_state']
        
        return JsonResponse({'success': True, 'message': 'OAuth authentication successful'})
        
    except Exception as e:
        return JsonResponse({'error': f'OAuth callback failed: {str(e)}'}, status=500)

def upload_to_google_drive_oauth(request, file_name, file_content, file_type='application/json'):
    """
    Upload file to Google Drive using OAuth 2.0 (uses YOUR personal drive storage)
    """
    try:
        # Get OAuth service
        service = get_google_drive_service(request)
        
        # If service is a redirect response, return it
        if hasattr(service, 'status_code'):
            return service
        
        print(f"🚀 Uploading to Google Drive via OAuth: {file_name}")
        
        # Convert content to bytes if needed
        if isinstance(file_content, str):
            file_content = file_content.encode('utf-8')
        
        # File metadata
        file_metadata = {
            'name': file_name,
            'mimeType': file_type
        }
        
        # Create media upload
        media = MediaIoBaseUpload(
            io.BytesIO(file_content),
            mimetype=file_type,
            resumable=False
        )
        
        # Upload file
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink, webContentLink'
        ).execute()
        
        print(f"✅ OAuth upload successful: {file.get('name')}")
        print(f"🔗 View URL: {file.get('webViewLink')}")
        
        # Make file publicly accessible
        try:
            permission = {
                'type': 'anyone',
                'role': 'reader'
            }
            service.permissions().create(
                fileId=file.get('id'),
                body=permission
            ).execute()
            print("🔓 File set to public access")
        except Exception as perm_error:
            print(f"⚠️ Could not set public access: {perm_error}")
        
        return {
            'url': file.get('webViewLink'),
            'file_id': file.get('id'),
            'file_name': file.get('name'),
            'download_url': file.get('webContentLink'),
            'success': True
        }
        
    except HttpError as error:
        error_details = error._get_reason()
        print(f"❌ Google Drive API error: {error_details}")
        raise Exception(f"Google Drive error: {error_details}")
            
    except Exception as e:
        print(f"❌ OAuth upload failed: {str(e)}")
        raise Exception(f"Upload failed: {str(e)}")
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_report_email(request):
    
    try:
        data = request.data
        recipient = data.get('recipient')
        subject = data.get('subject', 'Student Performance Report')
        message = data.get('message', 'Please find attached the student performance report.')
        report_content = data.get('reportContent', '')
        csv_content = data.get('csvContent', '')
        report_data = data.get('reportData', {})
        
        if not recipient:
            return Response(
                {'error': 'Recipient email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format
        if '@' not in recipient or '.' not in recipient:
            return Response(
                {'error': 'Invalid email address format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"📧 Preparing to send real email to: {recipient}")
        
        # Create the email body with better formatting
        email_body = f"""
{message}

---
Report Details:
• Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
• Total Students: {report_data.get('summary', {}).get('totalStudents', 'N/A')}
• Average GPA: {report_data.get('summary', {}).get('averageGPA', 'N/A')}
• Semester: {report_data.get('summary', {}).get('semester', 'N/A')}

This email contains attached reports in multiple formats for your convenience.
        """.strip()
        
        # Create email
        email = EmailMessage(
            subject=subject,
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        
        # Attach TXT report
        if report_content:
            email.attach(
                f'student_report_{timezone.now().strftime("%Y%m%d")}.txt',
                report_content.encode('utf-8'),
                'text/plain'
            )
            print(f"📎 Attached text report")
        
        # Attach CSV
        if csv_content:
            email.attach(
                f'student_data_{timezone.now().strftime("%Y%m%d")}.csv',
                csv_content.encode('utf-8'),
                'text/csv'
            )
            print(f"📎 Attached CSV data")
        
        # Attach JSON data
        if report_data:
            json_content = json.dumps(report_data, indent=2, ensure_ascii=False)
            email.attach(
                f'comprehensive_report_{timezone.now().strftime("%Y%m%d")}.json',
                json_content.encode('utf-8'),
                'application/json'
            )
            print(f"📎 Attached JSON report")
        
        # Send email with timeout
        import socket
        socket.setdefaulttimeout(30)  # 30 second timeout
        
        try:
            email_sent = email.send(fail_silently=False)
            print(f"✅ Real email sent successfully to: {recipient}")
            
            return Response({
                'success': True,
                'message': f'Report successfully sent to {recipient}',
                'recipient': recipient,
                'attachments': len(email.attachments),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            print(f"❌ Email sending failed: {str(email_error)}")
            
            # Provide specific error messages for common issues
            error_msg = str(email_error)
            if "authentication failed" in error_msg.lower():
                user_msg = "Email authentication failed. Please check email configuration."
            elif "connection refused" in error_msg.lower():
                user_msg = "Cannot connect to email server. Check network and SMTP settings."
            elif "timeout" in error_msg.lower():
                user_msg = "Email server connection timed out. Please try again."
            else:
                user_msg = f"Email delivery failed: {error_msg}"
            
            return Response(
                {'error': user_msg}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        print(f"❌ Email endpoint error: {str(e)}")
        return Response(
            {'error': f'Email service error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cloud_upload(request):
    """
    Upload report to Supabase Storage
    """
    try:
        data = request.data
        file_name = data.get('fileName', f'student_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json')
        file_content = data.get('fileContent', '')
        file_type = data.get('fileType', 'application/json')
        
        if not file_content:
            return Response(
                {'error': 'File content is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"☁️ Starting Supabase upload...")
        print(f"📁 File: {file_name}")
        print(f"📊 Content size: {len(file_content)} characters")
        
        # Upload to Supabase
        from .supabase_service import supabase_storage
        result = supabase_storage.upload_file(file_name, file_content, file_type)
        
        return Response({
            'success': True,
            'provider': 'supabase',
            'fileName': result['file_name'],
            'originalName': result['original_name'],
            'url': result['public_url'],
            'bucket': result['bucket'],
            'fileSize': result['file_size'],
            'message': 'File successfully uploaded to cloud storage',
            'timestamp': result['timestamp']
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Supabase upload failed: {error_msg}")
        
        return Response(
            {'error': f'Cloud upload failed: {error_msg}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_uploaded_files(request):
    """
    List all uploaded reports
    """
    try:
        from .supabase_service import supabase_storage
        
        files = supabase_storage.list_files(limit=50)
        
        # Format response
        formatted_files = []
        for file in files:
            if file['name'].endswith(('.json', '.csv', '.txt')):
                formatted_files.append({
                    'name': file['name'],
                    'size': file.get('metadata', {}).get('size', 0),
                    'created_at': file.get('created_at'),
                    'url': supabase_storage.get_file_url(file['name'])
                })
        
        return Response({
            'success': True,
            'files': formatted_files,
            'total': len(formatted_files),
            'bucket': supabase_storage.bucket_name
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to list files: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_uploaded_file(request, file_name):
    """
    Delete a file from storage
    """
    try:
        from .supabase_service import supabase_storage
        
        success = supabase_storage.delete_file(file_name)
        
        if success:
            return Response({
                'success': True,
                'message': f'File {file_name} deleted successfully'
            })
        else:
            return Response(
                {'error': 'Failed to delete file'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        return Response(
            {'error': f'Failed to delete file: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )