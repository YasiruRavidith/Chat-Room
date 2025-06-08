#!/usr/bin/env python
"""
Quick test to verify Django ASGI configuration
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_asgi_config():
    """Test if ASGI is properly configured"""
    try:
        from backend.asgi import application
        print("✅ ASGI application imported successfully")
        
        # Test if routing is properly configured
        from main.routing import websocket_urlpatterns
        print(f"✅ WebSocket URL patterns loaded: {len(websocket_urlpatterns)} patterns")
        
        for pattern in websocket_urlpatterns:
            print(f"   - {pattern.pattern}")
        
        # Test if middleware is working
        from main.middleware import JWTAuthMiddleware
        print("✅ JWT middleware imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ ASGI configuration error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing ASGI Configuration...")
    test_asgi_config()
    print("\n📋 To fix WebSocket issues:")
    print("1. Stop the current server (Ctrl+C)")
    print("2. Restart with: python manage.py runserver")
    print("3. Make sure you're using ws:// not http:// for WebSocket connections")
    print("4. Check that your frontend is connecting to the correct WebSocket URLs")