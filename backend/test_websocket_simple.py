#!/usr/bin/env python3
"""
Simple WebSocket client test for the chat application
"""
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/chat/1/"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            
            # Send a test message
            test_message = {
                "type": "chat_message",
                "message": "Hello from test client",
                "timestamp": "2025-06-08T10:30:00Z"
            }
            
            await websocket.send(json.dumps(test_message))
            print("📤 Sent test message")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Received: {response}")
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ Connection refused - WebSocket server not running")
    except asyncio.TimeoutError:
        print("⏰ Timeout waiting for response")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
