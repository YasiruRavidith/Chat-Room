#!/usr/bin/env python
"""
Direct test of AI service to debug response generation
"""
import os
import django
import sys

# Add the backend directory to Python path
sys.path.append('d:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend')

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.ai_service import AIService
from main.models import AIConfiguration

def test_ai_response():
    """Test AI response generation with debugging"""
    print("Testing AI Response Generation...")
    print("=" * 50)
    
    # Check AI configuration
    config = AIConfiguration.objects.filter(is_active=True).first()
    if config:
        print(f"Found AI Configuration:")
        print(f"  Model: {config.model_name}")
        print(f"  Temperature: {config.temperature}")
        print(f"  Max Tokens: {config.max_tokens}")
        print(f"  API Key: {config.api_key[:20]}...{config.api_key[-5:]}")
    else:
        print("No AI configuration found - creating default...")
    
    print("\nTesting AI Service...")
    
    # Create AI service
    ai_service = AIService()
    
    # Test with a simple message
    test_message = "Hello, how are you?"
    user_name = "TestUser"
    custom_message = "I'm currently offline but my AI assistant will help you!"
    
    print(f"\nTest input:")
    print(f"  Message: {test_message}")
    print(f"  User: {user_name}")
    print(f"  Custom message: {custom_message}")
    
    print("\n" + "=" * 50)
    print("Making AI request...")
    
    response = ai_service.generate_response(test_message, user_name, custom_message)
    
    print("=" * 50)
    print(f"Final response: {response}")

if __name__ == "__main__":
    test_ai_response()
