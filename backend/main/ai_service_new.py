# filepath: d:\Stuuuuuuuuupid\Chat Room\Chat Room 2.0\backend\main\ai_service.py
import json
from django.conf import settings
from .models import AIConfiguration

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("Warning: google-generativeai package not installed. AI responses will use fallback.")


class AIService:
    """Handle AI responses for offline users"""
    def __init__(self):
        self.config = AIConfiguration.objects.filter(is_active=True).first()
        if not self.config:
            # Create default configuration using default API key
            self.config = AIConfiguration.objects.create(
                api_key=getattr(settings, 'GEMINI_API_KEY', 'AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY'),
                model_name="gemini-1.5-flash",  # Use stable model name
                max_tokens=1000,
                temperature=0.7,
                is_active=True
            )
        
        # Initialize the GenAI client if available
        if GENAI_AVAILABLE:
            try:
                genai.configure(api_key=self.config.api_key)
                self.client_available = True
            except Exception as e:
                print(f"Failed to configure GenAI: {e}")
                self.client_available = False
        else:
            self.client_available = False
    
    def generate_response(self, user_message: str, offline_user_name: str, custom_message: str = None) -> str:
        """Generate AI response using Google Generative AI"""
        # Log detailed debug information
        try:
            with open('ai_debug.log', 'a') as log:
                log.write(f"\n--- AI Generation Request ---\n")
                log.write(f"GENAI_AVAILABLE: {GENAI_AVAILABLE}\n")
                log.write(f"Client available: {self.client_available}\n")
                log.write(f"Config: {self.config.__dict__ if self.config else None}\n")
        except:
            pass  # Don't let logging errors crash the service
            
        if not GENAI_AVAILABLE:
            try:
                with open('ai_debug.log', 'a') as log:
                    log.write("GenAI not available - returning fallback\n")
            except:
                pass
            return "I'm currently offline but will respond as soon as I'm back!"
            
        if not self.client_available:
            try:
                with open('ai_debug.log', 'a') as log:
                    log.write("Client not available - returning fallback\n")
            except:
                pass
            return "I'm currently offline but will respond as soon as I'm back!"
        
        try:
            # Prepare the system instruction and user message
            system_instruction = custom_message or f"You are {offline_user_name}'s AI assistant. {offline_user_name} is currently offline. Respond helpfully and in a friendly manner as if you're representing {offline_user_name}. Keep responses conversational and not too formal."
            
            try:
                with open('ai_debug.log', 'a') as log:
                    log.write(f"System instruction: {system_instruction}\n")
                    log.write(f"User message: {user_message}\n")
                    log.write(f"Using model: {self.config.model_name}\n")
                    log.write(f"Temperature: {self.config.temperature}\n")
                    log.write(f"Max tokens: {self.config.max_tokens}\n")
                    log.write(f"API Key (first 10 chars): {self.config.api_key[:10]}...\n")
            except:
                pass
            
            # Create the model with system instruction
            model = genai.GenerativeModel(
                model_name=self.config.model_name,
                system_instruction=system_instruction
            )
            
            # Generate response
            response = model.generate_content(
                user_message,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=self.config.max_tokens,
                    temperature=self.config.temperature
                )
            )
            
            try:
                with open('ai_debug.log', 'a') as log:
                    log.write(f"Response object: {response}\n")
                    log.write(f"Response text exists: {hasattr(response, 'text') and response.text is not None}\n")
            except:
                pass
            
            if response and hasattr(response, 'text') and response.text:
                ai_response = response.text.strip()
                try:
                    with open('ai_debug.log', 'a') as log:
                        log.write(f"Generated AI response: {ai_response}\n")
                except:
                    pass
                return ai_response
            else:
                try:
                    with open('ai_debug.log', 'a') as log:
                        log.write("No response text generated\n")
                except:
                    pass
                return "I'm currently offline but will respond as soon as I'm back!"
            
        except Exception as e:
            try:
                with open('ai_debug.log', 'a') as log:
                    log.write(f"AI Response Error: {e}\n")
                    import traceback
                    log.write(traceback.format_exc())
            except:
                pass
            return "I'm currently offline but will respond as soon as I'm back!"


def send_ai_response(group, offline_user, user_message):
    """Send AI response for offline user"""
    from .models import Message
    
    ai_service = AIService()
    ai_response = ai_service.generate_response(
        user_message, 
        offline_user.name, 
        offline_user.offline_ai_message
    )
    
    # Create AI response message
    Message.objects.create(
        group=group,
        sender=offline_user,
        content=ai_response,
        message_type=Message.MessageType.AI_RESPONSE
    )
