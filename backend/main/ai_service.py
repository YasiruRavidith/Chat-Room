# filepath: d:\Stuuuuuuuuupid\Chat Room\Chat Room 2.0\backend\main\ai_service.py

import json
from django.conf import settings
from .models import AIConfiguration, Message, User # Import Message and User models

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
            # Create default configuration
            self.config = AIConfiguration.objects.create(
                api_key=getattr(settings, 'GEMINI_API_KEY', 'AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY'),
                model_name="gemini-1.5-flash",
                max_tokens=1000,
                temperature=0.7,
                is_active=True
            )
        
        if GENAI_AVAILABLE:
            try:
                genai.configure(api_key=self.config.api_key)
                self.client_available = True
            except Exception as e:
                print(f"Failed to configure GenAI: {e}")
                self.client_available = False
        else:
            self.client_available = False
    
    # --- THIS METHOD IS REWRITTEN TO ACCEPT CHAT HISTORY ---
    def generate_response(self, chat_history: list[Message], offline_user: User, custom_message: str = None) -> str:
        """Generate AI response using Google Generative AI, with conversation history."""
        if not GENAI_AVAILABLE or not self.client_available:
            return "I'm currently offline but will respond as soon as I'm back!"
        
        try:
            # Prepare the system instruction
            system_instruction = custom_message or f"You are {offline_user.name}'s AI assistant. {offline_user.name} is currently offline. Respond helpfully and in a friendly manner as if you're representing {offline_user.name}. Keep responses conversational and not too formal."
            
            model = genai.GenerativeModel(
                model_name=self.config.model_name,
                system_instruction=system_instruction
            )
            
            # --- BUILD THE CONVERSATION HISTORY FOR THE API ---
            # The API expects a list of alternating 'user' and 'model' roles.
            # 'model' is the AI (the offline user's assistant).
            # 'user' is the person chatting with the AI.
            formatted_history = []
            for message in chat_history:
                role = "model" if message.sender == offline_user else "user"
                formatted_history.append({'role': role, 'parts': [message.content]})

            # Generate response from the full conversation history
            response = model.generate_content(
                formatted_history,  # Pass the entire history
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=self.config.max_tokens,
                    temperature=self.config.temperature
                )
            )
            
            if response and hasattr(response, 'text') and response.text:
                return response.text.strip()
            else:
                return "I'm having a bit of trouble thinking right now. I'll be back soon!"
            
        except Exception as e:
            print(f"AI Response Error: {e}")
            return "I'm currently offline but will respond as soon as I'm back!"


# --- THIS FUNCTION IS UPDATED TO FETCH AND PASS HISTORY ---
def send_ai_response(group, offline_user, user_message_content):
    """Fetch chat history and send AI response for offline user."""
    
    # Fetch the last 10 messages to provide context to the AI.
    # The `[::-1]` reverses the list to be in chronological order (oldest to newest).
    chat_history = Message.objects.filter(group=group).order_by('-created_at')[:100][::-1]

    if not chat_history:
        # This case should be rare, but as a fallback, create a temporary message object
        from .models import User as TempUser # Avoid ambiguity
        temp_sender = TempUser.objects.exclude(id=offline_user.id).first()
        chat_history = [Message(sender=temp_sender, content=user_message_content)]

    ai_service = AIService()
    ai_response_content = ai_service.generate_response(
        chat_history, 
        offline_user, 
        offline_user.offline_ai_message
    )
    
    # Create and save the AI response message in the database
    Message.objects.create(
        group=group,
        sender=offline_user,
        content=ai_response_content,
        message_type=Message.MessageType.AI_RESPONSE
    )