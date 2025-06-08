#!/usr/bin/env python
"""
Debug WebSocket connection issues
"""

import os
import django
import sys
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from main.models import User

def debug_websocket():
    """Debug WebSocket configuration"""
    
    print("=" * 60)
    print("🔍 WEBSOCKET DEBUG REPORT")
    print("=" * 60)
    
    # Check if users exist
    user_count = User.objects.count()
    print(f"👥 Users in database: {user_count}")
    
    if user_count > 0:
        # Get first user
        user = User.objects.first()
        print(f"👤 Using user: {user.username}")
        
        # Generate token
        token = AccessToken.for_user(user)
        print(f"🔑 Generated token: {str(token)}")
        
        # Test URLs
        print("\n📡 WebSocket URLs to test:")
        print(f"   Notifications: ws://127.0.0.1:8000/ws/notifications/?token={str(token)}")
        print(f"   Chat (example): ws://127.0.0.1:8000/ws/chat/1/?token={str(token)}")
        
        # Check Django settings
        print("\n⚙️ Django Configuration:")
        from django.conf import settings
        print(f"   DEBUG: {settings.DEBUG}")
        print(f"   INSTALLED_APPS includes 'channels': {'channels' in settings.INSTALLED_APPS}")
        print(f"   ASGI_APPLICATION: {getattr(settings, 'ASGI_APPLICATION', 'Not set')}")
        
        # Check channel layers
        if hasattr(settings, 'CHANNEL_LAYERS'):
            print(f"   CHANNEL_LAYERS: {settings.CHANNEL_LAYERS}")
        
        print("\n🔧 JavaScript test code:")
        print(f"""
const token = "{str(token)}";
const ws = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${{token}}`);

ws.onopen = function(event) {{
    console.log("✅ WebSocket connected!");
}};

ws.onmessage = function(event) {{
    console.log("📨 Message received:", event.data);
}};

ws.onerror = function(error) {{
    console.log("❌ WebSocket error:", error);
}};

ws.onclose = function(event) {{
    console.log("🔌 WebSocket closed:", event.code, event.reason);
}};
        """)
        
    else:
        print("❌ No users found! Create a user first:")
        print("   python manage.py createsuperuser")
    
    print("=" * 60)

if __name__ == "__main__":
    debug_websocket()
