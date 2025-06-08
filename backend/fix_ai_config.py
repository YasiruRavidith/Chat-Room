#!/usr/bin/env python
"""
Update AI configuration in database to use the correct model name
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

def update_ai_config():
    from main.models import AIConfiguration
    
    print("Updating AI Configuration...")
    
    # Get or create the configuration
    config, created = AIConfiguration.objects.get_or_create(
        id=1,
        defaults={
            'api_key': 'AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY',
            'model_name': 'gemini-1.5-flash',
            'max_tokens': 1000,
            'temperature': 0.7,
            'is_active': True
        }
    )
    
    if not created:
        # Update existing configuration
        config.model_name = 'gemini-1.5-flash'
        config.temperature = 0.7
        config.save()
        print("✅ Updated existing AI configuration")
    else:
        print("✅ Created new AI configuration")
    
    print(f"Current config: {config.model_name}, temp: {config.temperature}, active: {config.is_active}")
    
    # Test the configuration
    from main.ai_service import AIService
    ai_service = AIService()
    
    print(f"AI Service available: {ai_service.client_available}")
    print(f"Config model: {ai_service.config.model_name}")
    
    if ai_service.client_available:
        print("Testing AI response...")
        response = ai_service.generate_response("Hello world", "TestUser", "You are a helpful assistant.")
        print(f"Response: {response}")
        
        fallback = "I'm currently offline but will respond as soon as I'm back!"
        if response != fallback:
            print("✅ SUCCESS: AI is working properly!")
        else:
            print("❌ Still getting fallback response")
    else:
        print("❌ AI service not available")

if __name__ == "__main__":
    update_ai_config()
