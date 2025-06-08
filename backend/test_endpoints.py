#!/usr/bin/env python
"""
Quick test script to verify all API endpoints are accessible
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

def test_endpoints():
    print("🔍 Testing API Endpoints...")
    print("=" * 60)
    
    client = Client()
    
    # Test endpoints that don't require authentication
    endpoints_no_auth = [
        '/api/users/register/',
        '/api/token/',
    ]
    
    # Test endpoints that require authentication
    endpoints_with_auth = [
        '/api/users/blocked/',
        '/api/users/profile/',
        '/api/users/info/',
        '/api/ai/config/',
        '/api/ai/config/test/',
    ]
    
    print("📋 Testing endpoints without authentication:")
    for endpoint in endpoints_no_auth:
        try:
            response = client.get(endpoint)
            status = "✅ ACCESSIBLE" if response.status_code != 404 else "❌ NOT FOUND"
            print(f"   {endpoint}: {status} (Status: {response.status_code})")
        except Exception as e:
            print(f"   {endpoint}: ❌ ERROR - {e}")
    
    print("\n📋 Testing endpoints with authentication requirement:")
    for endpoint in endpoints_with_auth:
        try:
            response = client.get(endpoint)
            # For protected endpoints, we expect 401 (Unauthorized) not 404 (Not Found)
            if response.status_code == 404:
                status = "❌ NOT FOUND"
            elif response.status_code == 401 or response.status_code == 403:
                status = "✅ ACCESSIBLE (Auth Required)"
            else:
                status = f"⚠️  UNEXPECTED STATUS: {response.status_code}"
            print(f"   {endpoint}: {status}")
        except Exception as e:
            print(f"   {endpoint}: ❌ ERROR - {e}")
    
    # Test POST endpoints that were specifically problematic
    print("\n📋 Testing POST endpoints:")
    post_endpoints = [
        ('/api/groups/1/messages/read/', 'POST'),
        ('/api/ai/config/test/', 'POST'),
        ('/api/users/block/', 'POST'),
    ]
    
    for endpoint, method in post_endpoints:
        try:
            if method == 'POST':
                response = client.post(endpoint, {})
            else:
                response = client.get(endpoint)
            
            if response.status_code == 404:
                status = "❌ NOT FOUND"
            elif response.status_code in [401, 403]:
                status = "✅ ACCESSIBLE (Auth Required)"
            elif response.status_code in [400, 422]:
                status = "✅ ACCESSIBLE (Bad Request Expected)"
            else:
                status = f"✅ ACCESSIBLE (Status: {response.status_code})"
            print(f"   {method} {endpoint}: {status}")
        except Exception as e:
            print(f"   {method} {endpoint}: ❌ ERROR - {e}")
    
    print("\n" + "=" * 60)
    print("✅ Endpoint accessibility test completed!")
    print("💡 All endpoints should show 'ACCESSIBLE' or 'Auth Required' (not 'NOT FOUND')")

if __name__ == "__main__":
    test_endpoints()
