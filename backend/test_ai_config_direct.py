import os
import django
import sys

# Add the backend directory to Python path
sys.path.append('d:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend')

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from main.views import UserDetailView
import json

User = get_user_model()

def test_ai_config_request():
    """Test the AI configuration request that's causing 415 error"""
    
    # Create a test user
    try:
        user = User.objects.get(username='testuser')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    # Create request factory
    factory = RequestFactory()
    
    # Test data that mimics frontend request
    test_data = {
        'offline_mode_enabled': True,
        'offline_ai_message': 'I am currently offline, but my AI assistant will help you!',
        'ai_temperature': 0.8,
        'ai_max_tokens': 1500
    }
    
    print("Testing AI Configuration Request...")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    # Create a PUT request with JSON data
    request = factory.put(
        '/api/users/profile/',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    request.user = user
    
    # Test the view
    view = UserDetailView.as_view()
    
    try:
        response = view(request)
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ai_config_request()
