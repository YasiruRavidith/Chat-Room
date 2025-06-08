import requests
import json

# Test sending a message via API to see if it gets broadcasted via WebSocket
def test_message_api():
    base_url = "http://localhost:8000"
    
    # First, try to get a token (you'll need valid credentials)
    print("Testing message API endpoint...")
    
    # Test without authentication first to see if endpoint exists
    response = requests.post(f"{base_url}/api/groups/1/messages/", 
                           json={"content": "Test message from API"})
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
if __name__ == "__main__":
    test_message_api()
