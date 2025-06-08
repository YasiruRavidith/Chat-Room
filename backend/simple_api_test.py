import requests
import json

def test_message_api():
    """Simple test to check if message API endpoint works"""
    base_url = "http://localhost:8000"
    
    print("🚀 Testing Message API Endpoint")
    print("=" * 40)
    
    # Test data
    test_message = {
        "content": "Test message for API verification",
        "message_type": "text"
    }
    
    try:
        print(f"📤 Sending POST request to: {base_url}/api/groups/1/messages/")
        print(f"📋 Message data: {test_message}")
        
        response = requests.post(
            f"{base_url}/api/groups/1/messages/",
            json=test_message,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✅ SUCCESS: Message created successfully!")
            try:
                response_data = response.json()
                print(f"📋 Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"📋 Response Text: {response.text}")
        elif response.status_code == 401:
            print("⚠️  Authentication required - this is expected for protected endpoints")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"📋 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_message_api()
