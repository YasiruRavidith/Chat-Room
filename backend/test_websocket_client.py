#!/usr/bin/env python
"""
Test WebSocket client to verify connections work
"""

import asyncio
import websockets
import json
import sys
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from main.models import User

async def test_websocket_connection():
    """Test WebSocket connection with a valid JWT token"""
    
    # Get a user and create a token
    try:
        user = User.objects.get(username='ama')
        token = AccessToken.for_user(user)
        print(f"✅ Generated token for user: {user.username}")
        print(f"🔑 Token: {str(token)}")
        
        # Test notifications WebSocket
        notifications_url = f"ws://127.0.0.1:8000/ws/notifications/?token={str(token)}"
        print(f"\n🔗 Testing: {notifications_url}")
        
        try:
            async with websockets.connect(notifications_url) as websocket:
                print("✅ WebSocket connection successful!")
                
                # Send a test message
                test_message = {
                    "type": "test",
                    "message": "Hello WebSocket!"
                }
                await websocket.send(json.dumps(test_message))
                print("✅ Test message sent")
                
                # Try to receive a response (with timeout)
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    print(f"✅ Received response: {response}")
                except asyncio.TimeoutError:
                    print("⚠️  No response received (this is normal for notifications endpoint)")
                
        except websockets.exceptions.ConnectionClosedError as e:
            print(f"❌ WebSocket connection closed: {e}")
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            
    except User.DoesNotExist:
        print("❌ User 'ama' not found. Available users:")
        for user in User.objects.all():
            print(f"   - {user.username}")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return

if __name__ == "__main__":
    print("🧪 Testing WebSocket Connection...")
    asyncio.run(test_websocket_connection())
