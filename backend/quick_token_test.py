#!/usr/bin/env python
"""
Quick WebSocket test - run this in a separate terminal
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

def generate_test_token():
    """Generate a test token for WebSocket connection"""
    try:
        # Try to get user 'ama'
        user = User.objects.get(username='ama')
        token = AccessToken.for_user(user)
        
        print("=" * 60)
        print("🚀 WEBSOCKET TEST TOKEN GENERATED")
        print("=" * 60)
        print(f"👤 User: {user.username}")
        print(f"🔑 Token: {str(token)}")
        print()
        print("📋 Use this token in your frontend WebSocket connection:")
        print(f"   ws://127.0.0.1:8000/ws/notifications/?token={str(token)}")
        print()
        print("🔧 Or test with JavaScript in browser console:")
        print(f'   const ws = new WebSocket("ws://127.0.0.1:8000/ws/notifications/?token={str(token)}");')
        print('   ws.onopen = () => console.log("✅ Connected!");')
        print('   ws.onerror = (err) => console.log("❌ Error:", err);')
        print('   ws.onmessage = (msg) => console.log("📨 Message:", msg.data);')
        print("=" * 60)
        
        return str(token)
        
    except User.DoesNotExist:
        print("❌ User 'ama' not found. Available users:")
        for user in User.objects.all()[:5]:  # Show first 5 users
            print(f"   - {user.username}")
        
        if User.objects.exists():
            # Use the first available user
            first_user = User.objects.first()
            token = AccessToken.for_user(first_user)
            print(f"\n🔄 Using first available user: {first_user.username}")
            print(f"🔑 Token: {str(token)}")
            return str(token)
        else:
            print("❌ No users found in database!")
            return None
    except Exception as e:
        print(f"❌ Error generating token: {e}")
        return None

if __name__ == "__main__":
    generate_test_token()
