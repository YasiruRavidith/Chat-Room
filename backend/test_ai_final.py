#!/usr/bin/env python
"""
Final test of the AI service with Google GenAI SDK
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.ai_service import AIService

def test_ai_service():
    print("Testing AI Service with Google GenAI SDK...")
    print("=" * 50)
    
    try:
        # Initialize AI service
        ai_service = AIService()
        print(f"AI service initialized successfully")
        print(f"Config: {ai_service.config}")
        print(f"Client available: {ai_service.client is not None}")
        
        # Test response generation
        test_message = "Hello, how are you doing today?"
        test_user = "TestUser"
        
        print(f"\nTesting AI response generation...")
        print(f"User message: {test_message}")
        print(f"Offline user: {test_user}")
        
        response = ai_service.generate_response(test_message, test_user)
        print(f"\nAI Response: {response}")
        
        # Check if it's not a fallback response
        fallback_message = "I'm currently offline but will respond as soon as I'm back!"
        if response == fallback_message:
            print("\n❌ AI service returned fallback response - there may be an issue")
        else:
            print("\n✅ AI service generated a proper response!")
            
    except Exception as e:
        print(f"❌ Error testing AI service: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ai_service()
