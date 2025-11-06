import os
from supabase import create_client, Client
from django.conf import settings
from datetime import datetime
import json

class SupabaseStorage:
    def __init__(self):
        # Get Supabase credentials from settings
        self.url = getattr(settings, 'SUPABASE_URL', '')
        self.key = getattr(settings, 'SUPABASE_KEY', '')
        self.bucket_name = "student-reports"
        
        if not self.url or not self.key:
            raise Exception("Supabase credentials not configured. Add SUPABASE_URL and SUPABASE_KEY to settings.py")
        
        self.client: Client = create_client(self.url, self.key)
        self._ensure_bucket_exists()
        
    def _ensure_bucket_exists(self):
        """
        Ensure the storage bucket exists
        """
        try:
            # Try to get bucket info
            self.client.storage.get_bucket(self.bucket_name)
            print(f"✅ Supabase bucket '{self.bucket_name}' exists")
        except Exception as e:
            # Create bucket if it doesn't exist
            try:
                print(f"📦 Creating bucket: {self.bucket_name}")
                self.client.storage.create_bucket(
                    self.bucket_name,
                    options={"public": True}  # Make files publicly accessible
                )
                print(f"✅ Created Supabase bucket: {self.bucket_name}")
            except Exception as create_error:
                print(f"⚠️ Bucket creation might have failed: {create_error}")
    
    def upload_file(self, file_name, file_content, file_type="application/json"):
        """
        Upload file to Supabase Storage
        Returns public URL for accessing the file
        """
        try:
            print(f"☁️ Uploading to Supabase: {file_name}")
            
            # Generate unique file name with timestamp to avoid conflicts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_name = f"{timestamp}_{file_name}"
            
            # Convert to bytes if string
            if isinstance(file_content, str):
                file_content = file_content.encode('utf-8')
            
            # Upload file
            response = self.client.storage.from_(self.bucket_name).upload(
                path=unique_name,
                file=file_content,
                file_options={"content-type": file_type}
            )
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(unique_name)
            
            print(f"✅ File uploaded to Supabase: {unique_name}")
            print(f"🔗 Public URL: {public_url}")
            print(f"📊 File size: {len(file_content)} bytes")
            
            return {
                'success': True,
                'file_name': unique_name,
                'original_name': file_name,
                'public_url': public_url,
                'bucket': self.bucket_name,
                'file_size': len(file_content),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            error_msg = f"Supabase upload failed: {str(e)}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
    
    def list_files(self, limit=50):
        """
        List files in the bucket
        """
        try:
            files = self.client.storage.from_(self.bucket_name).list()
            # Sort by name (which includes timestamp)
            files.sort(key=lambda x: x['name'], reverse=True)
            return files[:limit]
        except Exception as e:
            print(f"❌ Failed to list files: {str(e)}")
            return []
    
    def delete_file(self, file_name):
        """
        Delete file from Supabase
        """
        try:
            self.client.storage.from_(self.bucket_name).remove([file_name])
            print(f"✅ File deleted: {file_name}")
            return True
        except Exception as e:
            print(f"❌ Failed to delete file: {str(e)}")
            return False
    
    def get_file_url(self, file_name):
        """
        Get public URL for a file
        """
        return self.client.storage.from_(self.bucket_name).get_public_url(file_name)

# Global instance
supabase_storage = SupabaseStorage()