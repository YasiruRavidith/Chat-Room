import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

def test_ai_with_output():
    try:
        from main.ai_service import AIService
        
        with open('ai_test_output.txt', 'w') as f:
            f.write("Testing AI Service...\n")
              # Initialize AI service
            ai_service = AIService()
            f.write(f"AI service initialized: {ai_service is not None}\n")
            f.write(f"Config exists: {ai_service.config is not None}\n")
            f.write(f"Client available: {ai_service.client_available}\n")
            
            if hasattr(ai_service, 'client_available') and ai_service.client_available:
                f.write("Testing AI response...\n")
                response = ai_service.generate_response("Hello", "TestUser")
                f.write(f"Response: {response}\n")
                
                fallback = "I'm currently offline but will respond as soon as I'm back!"
                if response != fallback:
                    f.write("SUCCESS: AI generated a real response!\n")
                else:
                    f.write("WARNING: AI returned fallback response\n")
            else:
                f.write("ERROR: AI client not available\n")
                
    except Exception as e:
        with open('ai_test_output.txt', 'w') as f:
            f.write(f"ERROR: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())

if __name__ == "__main__":
    test_ai_with_output()
