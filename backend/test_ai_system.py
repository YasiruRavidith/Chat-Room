#!/usr/bin/env python
"""
Simple validation test for AI configuration endpoints
"""
import os
import django
import sys

# Add the backend directory to Python path
sys.path.append('d:\\Stuuuuuuuuupid\\Chat Room\\Chat Room 2.0\\backend')

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_imports():
    """Test that all imports work correctly"""
    try:
        from main.views import AIConfigurationView, AIConfigTestView
        from main.ai_service import AIService
        from main.models import AIConfiguration, User
        print("✓ All imports successful")
        return True
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False

def test_ai_service():
    """Test AI service initialization"""
    try:
        from main.ai_service import AIService
        from main.models import AIConfiguration
        
        # Check if AI configuration exists or can be created
        config = AIConfiguration.objects.filter(is_active=True).first()
        if not config:
            print("No active AI configuration found - this is expected on first run")
        else:
            print(f"✓ Found AI configuration: {config.model_name}")
        
        # Test AI service initialization
        ai_service = AIService()
        print(f"✓ AI service initialized with model: {ai_service.config.model_name}")
        return True
    except Exception as e:
        print(f"✗ AI service error: {e}")
        return False

def main():
    print("Testing AI Configuration System...")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        return False
    
    # Test AI service
    if not test_ai_service():
        return False
    
    print("=" * 50)
    print("✓ All tests passed! AI configuration system should work correctly.")
    return True

if __name__ == "__main__":
    main()
