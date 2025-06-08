#!/usr/bin/env python
"""
Test AI real-time response functionality
This test verifies that AI responses are broadcasted in real-time via WebSocket
"""
import os
import sys
import django
import asyncio
import json
import websockets
import requests
import time
from threading import Thread

# Setup Django
sys.path.append('d:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from main.models import Group, Message, AIConfiguration
from main.ai_service import send_ai_response

User = get_user_model()

class AIRealtimeTest:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.ws_url = "ws://127.0.0.1:8000/ws/chat/"
        self.test_results = []
        self.received_messages = []
        
    def setup_test_data(self):
        """Create test users and group"""
        print("🔧 Setting up test data...")
        
        # Create users
        try:
            self.user1 = User.objects.get(username='testuser1')
        except User.DoesNotExist:
            self.user1 = User.objects.create_user(
                username='testuser1',
                email='test1@example.com',
                name='Test User 1',
                password='testpass123'
            )
        
        try:
            self.user2 = User.objects.get(username='testuser2')
        except User.DoesNotExist:
            self.user2 = User.objects.create_user(
                username='testuser2',
                email='test2@example.com',
                name='Test User 2',
                password='testpass123'
            )
        
        # Set user2 as offline with AI enabled
        self.user2.is_online = False
        self.user2.offline_mode_enabled = True
        self.user2.offline_ai_message = "I'm offline but my AI will help you!"
        self.user2.save()
        
        # Create or get a group
        self.group, created = Group.objects.get_or_create(
            name='AI Test Group',
            defaults={'is_private': True}
        )
        
        # Add users to group
        self.group.members.add(self.user1, self.user2)
        
        # Ensure AI configuration exists
        ai_config, created = AIConfiguration.objects.get_or_create(
            is_active=True,
            defaults={
                'model_name': 'gemini-1.5-flash',
                'api_key': 'AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY',
                'max_tokens': 1000,
                'temperature': 0.7
            }
        )
        
        print(f"✅ Test data setup complete:")
        print(f"   User 1: {self.user1.username} (online)")
        print(f"   User 2: {self.user2.username} (offline, AI enabled)")
        print(f"   Group: {self.group.name}")
        print(f"   AI Config: {ai_config.model_name}")
        
    def get_auth_token(self, username, password):
        """Get authentication token"""
        try:
            response = requests.post(f"{self.base_url}/api/auth/login/", {
                'username': username,
                'password': password
            })
            if response.status_code == 200:
                return response.json().get('access_token')
            else:
                print(f"❌ Login failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Login error: {e}")
            return None
    
    async def websocket_listener(self, group_id, token):
        """Listen for WebSocket messages"""
        try:
            uri = f"{self.ws_url}{group_id}/?token={token}"
            print(f"🔗 Connecting to WebSocket: {uri}")
            
            async with websockets.connect(uri) as websocket:
                print(f"✅ WebSocket connected to group {group_id}")
                
                # Listen for messages for 15 seconds
                timeout = 15
                start_time = time.time()
                
                while time.time() - start_time < timeout:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        self.received_messages.append(data)
                        
                        print(f"📨 Received WebSocket message:")
                        print(f"   Type: {data.get('type', 'unknown')}")
                        if 'message_data' in data:
                            msg_data = data['message_data']
                            print(f"   Content: {msg_data.get('content', '')[:50]}...")
                            print(f"   Sender: {msg_data.get('sender_name', '')}")
                            print(f"   Message Type: {msg_data.get('message_type', '')}")
                        
                    except asyncio.TimeoutError:
                        continue
                    except Exception as e:
                        print(f"❌ Error receiving message: {e}")
                        
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            self.test_results.append(("WebSocket Connection", "FAIL", str(e)))
    
    def send_test_message(self, token):
        """Send a test message via HTTP API"""
        try:
            # Wait a bit to ensure WebSocket is connected
            time.sleep(2)
            
            print("📤 Sending test message via API...")
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Send message that should trigger AI response
            message_data = {
                'content': 'hey AI, how are you doing today?',
                'message_type': 'TEXT'
            }
            
            response = requests.post(
                f"{self.base_url}/api/groups/{self.group.id}/messages/",
                json=message_data,
                headers=headers
            )
            
            if response.status_code == 201:
                print("✅ Test message sent successfully")
                print(f"   Message: {message_data['content']}")
                self.test_results.append(("API Message Creation", "PASS"))
            else:
                print(f"❌ Failed to send message: {response.status_code}")
                print(f"   Response: {response.text}")
                self.test_results.append(("API Message Creation", "FAIL", response.text))
                
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            self.test_results.append(("API Message Creation", "FAIL", str(e)))
    
    async def run_test(self):
        """Run the complete AI real-time test"""
        print("🚀 Starting AI Real-Time Response Test")
        print("=" * 60)
        
        # Setup test data
        self.setup_test_data()
        
        # Get authentication token
        token = self.get_auth_token('testuser1', 'testpass123')
        if not token:
            print("❌ Cannot continue without authentication token")
            return
        
        print(f"✅ Got authentication token")
        
        # Start WebSocket listener
        websocket_task = asyncio.create_task(
            self.websocket_listener(self.group.id, token)
        )
        
        # Send test message in a separate thread
        api_thread = Thread(target=self.send_test_message, args=(token,))
        api_thread.start()
        
        # Wait for WebSocket listener to complete
        await websocket_task
        api_thread.join()
        
        # Analyze results
        self.analyze_results()
    
    def analyze_results(self):
        """Analyze test results"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS ANALYSIS")
        print("=" * 60)
        
        # Check if we received any messages
        if not self.received_messages:
            print("❌ No WebSocket messages received")
            print("   This indicates the real-time messaging is not working")
            return
        
        print(f"✅ Received {len(self.received_messages)} WebSocket messages")
        
        # Check for AI response
        ai_responses = []
        user_messages = []
        
        for msg in self.received_messages:
            if 'message_data' in msg:
                msg_data = msg['message_data']
                msg_type = msg_data.get('message_type', '')
                sender_name = msg_data.get('sender_name', '')
                content = msg_data.get('content', '')
                
                if msg_type == 'AI_RESPONSE':
                    ai_responses.append({
                        'sender': sender_name,
                        'content': content,
                        'type': msg_type
                    })
                elif msg_type == 'TEXT':
                    user_messages.append({
                        'sender': sender_name,
                        'content': content,
                        'type': msg_type
                    })
        
        print(f"\n📝 Message breakdown:")
        print(f"   User messages: {len(user_messages)}")
        print(f"   AI responses: {len(ai_responses)}")
        
        # Check if AI responded in real-time
        if ai_responses:
            print(f"\n✅ AI REAL-TIME RESPONSE SUCCESS!")
            print(f"   AI responded {len(ai_responses)} time(s)")
            for ai_resp in ai_responses:
                print(f"   AI ({ai_resp['sender']}): {ai_resp['content'][:100]}...")
            
            print(f"\n🎉 CONCLUSION: AI responses are working in real-time!")
            print(f"   ✓ User messages are sent via API")
            print(f"   ✓ AI responses are generated automatically")  
            print(f"   ✓ AI responses are broadcasted via WebSocket")
            print(f"   ✓ Frontend should receive AI messages without refresh")
            
        else:
            print(f"\n❌ AI REAL-TIME RESPONSE FAILED")
            print(f"   No AI responses were received via WebSocket")
            
            if user_messages:
                print(f"   User messages were received, but no AI response followed")
                print(f"   This suggests an issue with AI response generation or broadcasting")
            else:
                print(f"   No messages received at all - WebSocket may not be working")
        
        # Print all test results
        print(f"\n📋 Detailed Test Results:")
        for test_name, result, *details in self.test_results:
            status = "✅" if result == "PASS" else "❌"
            print(f"   {status} {test_name}: {result}")
            if details:
                print(f"      Details: {details[0]}")

async def main():
    """Main test runner"""
    test = AIRealtimeTest()
    await test.run_test()

if __name__ == "__main__":
    asyncio.run(main())
