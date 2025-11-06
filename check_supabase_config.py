import os
import sys

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Set the correct Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

import django
django.setup()

from django.conf import settings

print("🔧 Supabase Configuration Check")
print("=" * 50)

# Check if settings exist
supabase_url = getattr(settings, 'SUPABASE_URL', None)
supabase_key = getattr(settings, 'SUPABASE_KEY', None)

print(f"📋 SUPABASE_URL: {supabase_url}")
print(f"🔑 SUPABASE_KEY: {supabase_key}")

if not supabase_url or 'your-project' in supabase_url:
    print("\n❌ SUPABASE_URL not properly configured!")
else:
    print("✅ SUPABASE_URL looks good")

if not supabase_key or 'your-anon' in supabase_key:
    print("❌ SUPABASE_KEY not properly configured!")
else:
    print("✅ SUPABASE_KEY looks good")

# Check if we can import supabase
try:
    from supabase import create_client
    print("✅ Supabase package installed")
    
    if supabase_url and supabase_key and 'your-project' not in supabase_url:
        print("\n🔌 Testing Supabase connection...")
        try:
            client = create_client(supabase_url, supabase_key)
            # Try a simple operation
            buckets = client.storage.list_buckets()
            print("✅ Supabase connection successful!")
        except Exception as e:
            print(f"❌ Supabase connection failed: {e}")
    
except ImportError:
    print("❌ Supabase package not installed. Run: pip install supabase")

print("\n💡 Next steps:")
if not supabase_url or 'your-project' in supabase_url:
    print("1. Go to https://supabase.com and create a project")
    print("2. Get your URL and key from Settings → API")
    print("3. Add to mysite/settings.py:")
    print("   SUPABASE_URL = 'https://your-actual-project-ref.supabase.co'")
    print("   SUPABASE_KEY = 'your-actual-anon-key'")
else:
    print("1. Your credentials are set, but there might be a connection issue")
    print("2. Check your internet connection")
    print("3. Verify the Supabase project is active")