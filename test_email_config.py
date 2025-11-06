# test_email_config.py
import os
import sys
import django

# Setup Django
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email_config():
    print("🧪 Testing Email Configuration")
    print("=" * 40)
    
    print(f"📧 Email host: {settings.EMAIL_HOST}")
    print(f"🔑 Email user: {settings.EMAIL_HOST_USER}")
    print(f"🔒 Password set: {'Yes' if settings.EMAIL_HOST_PASSWORD else 'No'}")
    
    try:
        # Test sending a simple email
        send_mail(
            'Test Email from Student Reports System',
            'This is a test email to verify your email configuration is working correctly.',
            settings.DEFAULT_FROM_EMAIL,
            ['agathonek@gmail.com'],  # Send to yourself
            fail_silently=False,
        )
        print("✅ Email sent successfully!")
        print("📬 Check your Gmail inbox for the test email")
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        print("\n🔧 Common solutions:")
        print("1. Make sure 2-Factor Authentication is enabled on your Gmail")
        print("2. Verify the app password is correct (16 characters, no spaces)")
        print("3. Check that 'Less secure app access' is turned OFF")
        print("4. Try regenerating the app password")

if __name__ == '__main__':
    test_email_config()