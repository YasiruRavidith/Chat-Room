#!/usr/bin/env python
"""
Direct test of google-genai package availability
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_genai_import():
    print("Testing google-genai import...")
    
    try:
        from google import genai
        print("✅ Successfully imported google.genai")
        
        from google.genai import types
        print("✅ Successfully imported google.genai.types")
        
        # Test client creation (without API key)
        try:
            client = genai.Client(api_key="test")
            print("✅ Client creation works")
        except Exception as e:
            print(f"Client creation error (expected): {e}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Other error: {e}")
        return False

def test_django_setup():
    print("\nTesting Django setup...")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        
        import django
        django.setup()
        print("✅ Django setup successful")
        
        from main.models import AIConfiguration
        print("✅ Models imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Django setup error: {e}")
        return False

def main():
    genai_ok = test_genai_import()
    django_ok = test_django_setup()
    
    if genai_ok and django_ok:
        print("\n✅ All basic components are working")
        
        # Now test the AI service specifically
        try:
            from main.ai_service import AIService, GENAI_AVAILABLE
            print(f"GENAI_AVAILABLE: {GENAI_AVAILABLE}")
            
            ai_service = AIService()
            print(f"AI Service config: {ai_service.config}")
            print(f"AI Service client: {ai_service.client}")
            
            if ai_service.client:
                print("Attempting to generate response...")
                response = ai_service.generate_response("Hello world", "TestUser")
                print(f"Response: {response}")
            else:
                print("No client available")
                
        except Exception as e:
            print(f"❌ AI Service error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("\n❌ Basic components failed")

if __name__ == "__main__":
    main()
