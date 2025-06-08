#!/usr/bin/env python
"""
Quick test to check AI real-time response status
"""
import os
import sys
import django

# Setup Django
sys.path.append('d:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def quick_status_check():
    print("🔍 QUICK AI REAL-TIME STATUS CHECK")
    print("=" * 50)
    
    try:
        from main.models import AIConfiguration, User
        from main.ai_service import AIService
        
        # Check AI configuration
        config = AIConfiguration.objects.filter(is_active=True).first()
        if config:
            print(f"✅ AI Configuration found:")
            print(f"   Model: {config.model_name}")
            print(f"   Temperature: {config.temperature}")
            print(f"   Max Tokens: {config.max_tokens}")
            print(f"   Active: {config.is_active}")
            
            # Fix model name if needed
            if config.model_name == "gemini-pro":
                print(f"⚠️  Updating deprecated model name...")
                config.model_name = "gemini-1.5-flash"
                config.save()
                print(f"✅ Updated to: {config.model_name}")
        else:
            print(f"⚠️  No AI configuration found - will be created on first use")
        
        # Test AI service
        ai_service = AIService()
        print(f"✅ AI Service initialized")
        print(f"   Client available: {ai_service.client_available}")
        
        # Check if backend files have the fixes
        print(f"\n🔍 Checking AI Service WebSocket fixes...")
        
        ai_service_path = 'd:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend\\main\\ai_service.py'
        with open(ai_service_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ("MessageSerializer import", 'from .serializers import MessageSerializer' in content),
            ("Event structure", "'type': 'chat_message'" in content),
            ("Timer in views.py", check_views_timer())
        ]
        
        all_good = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
            if not passed:
                all_good = False
        
        print(f"\n📊 STATUS SUMMARY:")
        if all_good:
            print(f"🎉 ALL SYSTEMS GO! AI real-time responses should work properly.")
            print(f"\nTo test:")
            print(f"1. Start backend: python manage.py runserver 8000")
            print(f"2. Start frontend: npm run dev")
            print(f"3. Create two users, set one offline with AI enabled")
            print(f"4. Send 'hey AI' message - AI should respond in real-time")
        else:
            print(f"⚠️  Some issues found - please review the failed checks above")
        
        return all_good
        
    except Exception as e:
        print(f"❌ Error during status check: {e}")
        return False

def check_views_timer():
    """Check if views.py has the Timer delay"""
    try:
        views_path = 'd:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend\\main\\views.py'
        with open(views_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return 'Timer(1.0, lambda: send_ai_response' in content
    except:
        return False

if __name__ == "__main__":
    quick_status_check()
