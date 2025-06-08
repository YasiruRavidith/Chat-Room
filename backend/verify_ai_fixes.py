#!/usr/bin/env python
"""
Verify AI Real-time Broadcasting Fix Status
This script checks if all the fixes are properly implemented
"""
import os
import sys
import django

# Setup Django
sys.path.append('d:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def check_ai_service_websocket_fix():
    """Check if ai_service.py has the correct WebSocket broadcasting format"""
    print("🔍 Checking AI Service WebSocket Broadcasting Fix...")
    
    ai_service_path = 'd:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend\\main\\ai_service.py'
    
    try:
        with open(ai_service_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for the fixed WebSocket broadcasting code
        checks = [
            ('MessageSerializer import', 'from .serializers import MessageSerializer' in content),
            ('Event structure', "'type': 'chat_message'" in content),
            ('Message data structure', "'message_data': message_data" in content),
            ('Request context', 'request.user = offline_user' in content),
            ('WebSocket broadcasting', 'async_to_sync(channel_layer.group_send)(room_group_name, event)' in content)
        ]
        
        all_passed = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}: {'FOUND' if passed else 'MISSING'}")
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error reading ai_service.py: {e}")
        return False

def check_views_timer_fix():
    """Check if views.py has the Timer delay for AI responses"""
    print("\n🔍 Checking Views Timer Fix...")
    
    views_path = 'd:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend\\main\\views.py'
    
    try:
        with open(views_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for the Timer delay code
        checks = [
            ('Timer import', 'from threading import Timer' in content),
            ('Timer delay', 'Timer(1.0, lambda: send_ai_response' in content),
            ('Timer start', 'timer.start()' in content)
        ]
        
        all_passed = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}: {'FOUND' if passed else 'MISSING'}")
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error reading views.py: {e}")
        return False

def check_ai_configuration():
    """Check if AI configuration is properly set up"""
    print("\n🔍 Checking AI Configuration...")
    
    try:
        from main.models import AIConfiguration
        from main.ai_service import AIService
        
        # Check AI configuration
        config = AIConfiguration.objects.filter(is_active=True).first()
        if config:
            print(f"   ✅ AI Configuration found:")
            print(f"      Model: {config.model_name}")
            print(f"      Temperature: {config.temperature}")
            print(f"      Max Tokens: {config.max_tokens}")
            print(f"      Active: {config.is_active}")
        else:
            print(f"   ⚠️ No active AI configuration found (will be created on first use)")
        
        # Test AI service initialization
        ai_service = AIService()
        print(f"   ✅ AI Service initialized successfully")
        print(f"      Client available: {ai_service.client_available}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking AI configuration: {e}")
        return False

def check_consumer_message_handling():
    """Check if consumers.py handles chat_message events correctly"""
    print("\n🔍 Checking Consumer Message Handling...")
    
    consumers_path = 'd:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend\\main\\consumers.py'
    
    try:
        with open(consumers_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for chat_message handler
        checks = [
            ('chat_message method', 'async def chat_message(self, event):' in content),
            ('message_data extraction', "message_data = event['message_data']" in content),
            ('WebSocket send', 'await self.send(text_data=' in content)
        ]
        
        all_passed = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}: {'FOUND' if passed else 'MISSING'}")
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error reading consumers.py: {e}")
        return False

def main():
    """Run all verification checks"""
    print("🔧 AI REAL-TIME RESPONSE FIX VERIFICATION")
    print("=" * 50)
    
    checks = [
        ("AI Service WebSocket Fix", check_ai_service_websocket_fix),
        ("Views Timer Fix", check_views_timer_fix),
        ("AI Configuration", check_ai_configuration),
        ("Consumer Message Handling", check_consumer_message_handling)
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ Error running {check_name}: {e}")
            results.append((check_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)
    
    all_passed = True
    for check_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {check_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 ALL CHECKS PASSED!")
        print("The AI real-time response fixes are properly implemented.")
        print("\nNext steps:")
        print("1. Start both backend and frontend servers")
        print("2. Test AI responses in the chat interface")
        print("3. Verify AI messages appear in real-time without page refresh")
    else:
        print("⚠️  SOME CHECKS FAILED!")
        print("Please review the failed checks above and ensure all fixes are applied.")
    
    return all_passed

if __name__ == "__main__":
    main()
