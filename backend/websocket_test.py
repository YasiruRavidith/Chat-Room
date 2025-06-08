"""
WebSocket Test Instructions and Troubleshooting

To fix the WebSocket connection issues, follow these steps:

1. INSTALL REQUIRED PACKAGES:
   pip install channels channels-redis redis

2. START REDIS SERVER (if using Redis channel layer):
   - Download and install Redis for Windows
   - Or use Docker: docker run -d -p 6379:6379 redis

3. UPDATE SETTINGS (if you want to use Redis):
   Uncomment the Redis channel layer in settings.py

4. RUN DJANGO WITH ASGI:
   python manage.py runserver

5. TEST WEBSOCKET CONNECTION:
   Use the test below to verify WebSocket is working

Common Issues:
- Make sure Django server is running on port 8000
- Ensure JWT token is valid and not expired
- Check that ASGI application is properly configured
- Verify middleware is correctly set up
"""

# Test WebSocket connection (for debugging)
import asyncio
import websockets
import json

async def test_websocket():
    """Test WebSocket connection to ensure it's working"""
    try:
        # Replace with your actual JWT token
        token = "your_jwt_token_here"
        uri = f"ws://127.0.0.1:8000/ws/notifications/?token={token}"
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "test",
                "message": "Hello WebSocket!"
            }
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            response = await websocket.recv()
            print(f"📨 Received: {response}")
            
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

if __name__ == "__main__":
    # Uncomment to test WebSocket connection
    # asyncio.run(test_websocket())
    pass