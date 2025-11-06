import os
import sys
import django
import json

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Set the correct Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

print("✅ Django setup successful!")
print(f"📁 Project root: {project_root}")

def test_supabase_integration():
    print("\n🧪 Testing Supabase Integration")
    print("=" * 50)
    
    try:
        # Import from your reports app
        from reports.supabase_service import SupabaseStorage
        
        # Create storage instance
        storage = SupabaseStorage()
        
        # Test data
        test_data = {
            "test": "This is a test file for Supabase Storage",
            "timestamp": "2024-01-01",
            "purpose": "Testing Supabase integration",
            "status": "success"
        }
        
        print("📤 Testing file upload...")
        
        # Upload test file
        result = storage.upload_file(
            file_name="test_supabase_integration.json",
            file_content=json.dumps(test_data, indent=2),
            file_type="application/json"
        )
        
        print("✅ Upload successful!")
        print(f"📁 File: {result['file_name']}")
        print(f"🔗 URL: {result['public_url']}")
        print(f"📊 Size: {result['file_size']} bytes")
        
        # Test listing files
        print("\n📋 Testing file listing...")
        files = storage.list_files(limit=5)
        print(f"Found {len(files)} files in bucket:")
        for file in files:
            print(f"  - {file['name']} ({file.get('metadata', {}).get('size', 0)} bytes)")
        
        print(f"\n🌐 Visit this URL to verify: {result['public_url']}")
        
        print("\n🎉 Supabase integration test completed successfully!")
        print("💡 Your cloud storage is ready to use!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        print(f"🔍 Detailed error: {traceback.format_exc()}")
        
        print("\n🔧 Troubleshooting:")
        print("1. Check SUPABASE_URL and SUPABASE_KEY in settings")
        print("2. Verify internet connection")
        print("3. Check Supabase project is active")
        
        return False

if __name__ == '__main__':
    test_supabase_integration()