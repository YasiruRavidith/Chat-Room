#!/usr/bin/env python3
"""
Comprehensive test for real-time messaging functionality
Tests the critical fix where messages created via POST API should reach frontend via WebSocket
"""

import asyncio
import websockets
import json
import requests
import threading
import time
from datetime import datetime

class RealTimeMessagingTest:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.ws_url = "ws://localhost:8000/ws/chat/1/"
        self.received_messages = []
        self.test_results = []
        
    async def websocket_listener(self):
        """Listen for WebSocket messages"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                print("✅ WebSocket connected successfully")
                self.test_results.append(("WebSocket Connection", "PASS"))
                
                # Listen for messages for 10 seconds
                timeout = 10
                start_time = time.time()
                
                while time.time() - start_time < timeout:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        self.received_messages.append(data)
                        print(f"📨 Received WebSocket message: {data}")
                    except asyncio.TimeoutError:
                        continue
                    except Exception as e:
                        print(f"❌ Error receiving message: {e}")
                        
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            self.test_results.append(("WebSocket Connection", "FAIL", str(e)))

    def send_api_message(self):
        """Send a message via HTTP API"""
        test_message = {
            "content": f"Test message sent at {datetime.now().strftime('%H:%M:%S')}",
            "message_type": "text"
        }
        
        try:
            # Wait a bit for WebSocket to connect
            time.sleep(2)
            
            print(f"📤 Sending API message: {test_message['content']}")
            response = requests.post(
                f"{self.base_url}/api/groups/1/messages/",
                json=test_message,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📊 API Response - Status: {response.status_code}")
            
            if response.status_code == 201:
                print("✅ Message created successfully via API")
                self.test_results.append(("API Message Creation", "PASS"))
                
                # Parse response to check message data
                try:
                    response_data = response.json()
                    print(f"📋 Created message data: {response_data}")
                except:
                    print("📋 Response text:", response.text)
            else:
                print(f"❌ API request failed: {response.text}")
                self.test_results.append(("API Message Creation", "FAIL", response.text))
                
        except Exception as e:
            print(f"❌ API request error: {e}")
            self.test_results.append(("API Message Creation", "FAIL", str(e)))

    async def run_test(self):
        """Run the complete real-time messaging test"""
        print("🚀 Starting Real-Time Messaging Test")
        print("=" * 50)
        
        # Start WebSocket listener
        websocket_task = asyncio.create_task(self.websocket_listener())
        
        # Send API message after a short delay
        api_thread = threading.Thread(target=self.send_api_message)
        api_thread.start()
        
        # Wait for WebSocket listener to complete
        await websocket_task
        api_thread.join()
        
        # Analyze results
        self.analyze_results()

    def analyze_results(self):
        """Analyze test results and provide summary"""
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        for result in self.test_results:
            if len(result) == 2:
                test_name, status = result
                print(f"{status}: {test_name}")
            else:
                test_name, status, error = result
                print(f"{status}: {test_name} - {error}")
        
        print(f"\n📨 Total WebSocket messages received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\n📋 Received Messages:")
            for i, msg in enumerate(self.received_messages, 1):
                print(f"  {i}. {msg}")
            
            # Check if any message matches our test message
            test_message_found = any(
                "Test message sent at" in str(msg) 
                for msg in self.received_messages
            )
            
            if test_message_found:
                print("\n✅ SUCCESS: Test message was received via WebSocket!")
                print("🎉 Real-time messaging is working correctly!")
            else:
                print("\n⚠️  WARNING: Test message not found in WebSocket messages")
                print("💡 This might indicate the WebSocket broadcasting isn't working")
        else:
            print("\n❌ CRITICAL: No WebSocket messages received")
            print("💡 Possible issues:")
            print("   - WebSocket connection failed")
            print("   - Message broadcasting not implemented")
            print("   - WebSocket consumer not handling messages correctly")

async def main():
    test = RealTimeMessagingTest()
    await test.run_test()

if __name__ == "__main__":
    print("🔧 Real-Time Messaging Test")
    print("This test verifies the critical fix for WebSocket message broadcasting")
    print("When a message is created via POST API, it should be received via WebSocket")
    print()
    
    asyncio.run(main())
