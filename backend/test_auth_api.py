import requests
import json

def test_auth_and_api():
    """Test authentication and API endpoint"""
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Authentication and API")
    print("=" * 50)
    
    # Test creating a user first (if needed)
    test_user = {
        "username": "testuser",
        "password": "testpass123",
        "name": "Test User",
        "email": "test@example.com"
    }
    
    try:
        # Try to create user (will fail if exists, that's ok)
        print("📝 Creating test user...")
        response = requests.post(f"{base_url}/api/user/register/", json=test_user)
        if response.status_code == 201:
            print("✅ Test user created successfully")
        else:
            print(f"ℹ️  User creation response: {response.status_code} (user may already exist)")
    except Exception as e:
        print(f"⚠️  User creation error: {e}")
    
    # Get authentication token
    try:
        print("\n🔑 Getting authentication token...")
        login_data = {"username": test_user["username"], "password": test_user["password"]}
        response = requests.post(f"{base_url}/api/token/", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access')
            print("✅ Authentication successful!")
            print(f"🔗 Token obtained: {access_token[:20]}...")
            
            # Test authenticated API call
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Test getting user info
            print("\n👤 Testing user info endpoint...")
            user_response = requests.get(f"{base_url}/api/user/info/", headers=headers)
            if user_response.status_code == 200:
                user_data = user_response.json()
                print(f"✅ User info retrieved: {user_data.get('name')} ({user_data.get('username')})")
                
                # Test getting groups
                print("\n👥 Testing groups endpoint...")
                groups_response = requests.get(f"{base_url}/api/groups/", headers=headers)
                if groups_response.status_code == 200:
                    groups_data = groups_response.json()
                    print(f"✅ Groups retrieved: {len(groups_data)} groups found")
                    
                    # Test message API with authentication
                    if groups_data:
                        group_id = groups_data[0].get('id', 1)
                    else:
                        group_id = 1  # Default to group 1
                    
                    print(f"\n📤 Testing message API with group {group_id}...")
                    message_data = {
                        "content": "Test authenticated message",
                        "message_type": "text"
                    }
                    
                    message_response = requests.post(
                        f"{base_url}/api/groups/{group_id}/messages/",
                        json=message_data,
                        headers=headers
                    )
                    
                    print(f"📊 Message API Response: {message_response.status_code}")
                    if message_response.status_code == 201:
                        print("✅ SUCCESS: Authenticated message created!")
                        try:
                            response_data = message_response.json()
                            print(f"📋 Message Data: {json.dumps(response_data, indent=2)}")
                        except:
                            print(f"📋 Response Text: {message_response.text}")
                    else:
                        print(f"❌ Message creation failed: {message_response.text}")
                else:
                    print(f"❌ Groups endpoint failed: {groups_response.status_code} - {groups_response.text}")
            else:
                print(f"❌ User info failed: {user_response.status_code} - {user_response.text}")
        else:
            print(f"❌ Authentication failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Authentication error: {e}")

if __name__ == "__main__":
    test_auth_and_api()
