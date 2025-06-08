#!/usr/bin/env python
"""
Test script for AI configuration endpoint
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def test_ai_config_endpoint():
    """Test the AI configuration endpoint with different content types"""
    
    # Test data that mimics what the frontend sends
    test_data = {
        'offline_mode_enabled': True,
        'offline_ai_message': 'I am currently offline, but my AI assistant will help you!',
        'ai_temperature': 0.8,
        'ai_max_tokens': 1500
    }
    
    print("Testing AI Configuration Endpoint...")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    # Test with JSON content type (what the frontend likely sends)
    print("\n1. Testing with JSON content type:")
    try:
        response = requests.put(
            f"{BASE_URL}/users/profile/",
            json=test_data,
            headers={
                'Content-Type': 'application/json',
                # Note: In real usage, you would need to include the auth token
                # 'Authorization': 'Bearer <token>'
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test with form data content type
    print("\n2. Testing with form data content type:")
    try:
        response = requests.put(
            f"{BASE_URL}/users/profile/",
            data=test_data,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ai_config_endpoint()
