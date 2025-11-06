# Add this to views.py or create a separate services.py
import os
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

def get_google_drive_service():
    """
    Get authenticated Google Drive service
    """
    try:
        # You'll need to set up OAuth2 credentials
        # Create credentials.json file from Google Cloud Console
        creds = None
        
        # The file token.json stores the user's access and refresh tokens.
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json')
        
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                # For service account (recommended for server-side)
                from google.oauth2 import service_account
                
                SERVICE_ACCOUNT_FILE = 'credentials.json'
                
                if os.path.exists(SERVICE_ACCOUNT_FILE):
                    creds = service_account.Credentials.from_service_account_file(
                        SERVICE_ACCOUNT_FILE,
                        scopes=['https://www.googleapis.com/auth/drive.file']
                    )
                else:
                    raise Exception("Google Drive credentials not configured")
            
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        
        return build('drive', 'v3', credentials=creds)
    
    except Exception as e:
        raise Exception(f"Google Drive authentication failed: {str(e)}")

def upload_to_google_drive(file_name, file_content, file_type='application/json'):
    """
    Real Google Drive upload
    """
    try:
        service = get_google_drive_service()
        
        # Create file metadata
        file_metadata = {
            'name': file_name,
            'mimeType': file_type
        }
        
        # Create media upload
        file_bytes = file_content.encode('utf-8') if isinstance(file_content, str) else file_content
        media = MediaIoBaseUpload(io.BytesIO(file_bytes), 
                                mimetype=file_type,
                                resumable=True)
        
        # Upload file
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        
        print(f"✅ Google Drive upload successful: {file.get('id')}")
        
        return {
            'url': file.get('webViewLink'),
            'file_id': file.get('id'),
            'success': True
        }
        
    except Exception as e:
        raise Exception(f"Google Drive upload failed: {str(e)}")
    
def upload_to_dropbox(file_name, file_content):
    """
    Real Dropbox upload
    """
    try:
        import dropbox
        
        # Get access token from settings or environment
        access_token = getattr(settings, 'DROPBOX_ACCESS_TOKEN', None)
        if not access_token:
            raise Exception("Dropbox access token not configured")
        
        dbx = dropbox.Dropbox(access_token)
        
        # Upload file
        file_bytes = file_content.encode('utf-8') if isinstance(file_content, str) else file_content
        
        result = dbx.files_upload(
            file_bytes,
            f'/StudentReports/{file_name}',
            mode=dropbox.files.WriteMode.overwrite
        )
        
        # Create shared link
        shared_link = dbx.sharing_create_shared_link_with_settings(
            result.path_display
        )
        
        print(f"✅ Dropbox upload successful: {result.name}")
        
        return {
            'url': shared_link.url,
            'file_id': result.id,
            'success': True
        }
        
    except Exception as e:
        raise Exception(f"Dropbox upload failed: {str(e)}")    