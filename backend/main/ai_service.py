# filepath: main/ai_service.py

import json
from django.conf import settings
from .models import AIConfiguration, Message, User
import mimetypes

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
            self.config = AIConfiguration.objects.create(
                api_key=getattr(settings, 'GEMINI_API_KEY', 'default_key_if_not_set'),
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
    
    def generate_response(self, chat_history: list[Message], offline_user: User, custom_message: str = None) -> str:
        if not GENAI_AVAILABLE or not self.client_available:
            return "I'm currently offline but will respond as soon as I'm back!"
        
        try:
            # system_instruction = custom_message or f"You are {offline_user.name}'s AI assistant. {offline_user.name} is currently offline. Respond helpfully and in a friendly manner as if you're representing {offline_user.name}. Very importantly: Only respond when the user says \"hey AI\"."
            system_instruction = custom_message or f"Very importantly: Only respond when the user says \"hey AI\". Be bainroting."

            model = genai.GenerativeModel(
                model_name=self.config.model_name,
                system_instruction=system_instruction
            )
            
            formatted_history = []
            for message in chat_history:
                role = "model" if message.sender == offline_user else "user"
                parts = []
                
                if message.content:
                    parts.append(message.content)
                
                if message.file_attachment and message.message_type == Message.MessageType.IMAGE:
                    try:
                        image_path = message.file_attachment.path
                        mime_type = mimetypes.guess_type(image_path)[0] or 'image/jpeg'
                        
                        # --- THIS IS THE FIX ---
                        # Read the file in binary mode to get the raw, valid bytes.
                        with open(image_path, 'rb') as f:
                            image_bytes = f.read()
                        
                        # The API expects a dictionary for image parts
                        image_part = {
                            "mime_type": mime_type,
                            "data": image_bytes
                        }
                        parts.append(image_part)

                    except FileNotFoundError:
                        print(f"Warning: AI could not find image file at {message.file_attachment.path}")
                    except Exception as img_e:
                        print(f"Warning: AI could not process image {message.file_attachment.path}: {img_e}")

                if parts:
                    formatted_history.append({'role': role, 'parts': parts})
            
            if not formatted_history:
                return "I'm not sure how to respond to that."

            # The Gemini API is robust enough to handle the full history directly
            response = model.generate_content(
                formatted_history,
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
            # Provide a more specific error for debugging
            if "API key not valid" in str(e):
                return "My AI configuration is incorrect. Please contact the administrator."
            return "I'm currently offline but will respond as soon as I'm back!"


def send_ai_response(group, offline_user, user_message_content):
    """Send AI response and broadcast it via WebSocket"""
    chat_history = Message.objects.filter(group=group).order_by('-created_at')[:10][::-1]

    if not chat_history:
        return

    ai_service = AIService()
    ai_response_content = ai_service.generate_response(
        chat_history, 
        offline_user, 
        offline_user.offline_ai_message
    )
    
    # Create the AI response message
    ai_message = Message.objects.create(
        group=group,
        sender=offline_user,
        content=ai_response_content,
        message_type=Message.MessageType.AI_RESPONSE
    )
      # Broadcast AI response via WebSocket
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from .serializers import MessageSerializer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            room_group_name = f'chat_{group.id}'
            
            # Use the same serialization as in views.py for consistency
            from django.http import HttpRequest
            request = HttpRequest()
            request.user = offline_user  # Set the user for context
            
            # Serialize the AI message to get all computed fields
            message_data = MessageSerializer(ai_message, context={'request': request}).data
            
            # The event dictionary to be broadcast (same format as views.py)
            event = {
                'type': 'chat_message',  # This matches the consumer method name
                'message_data': message_data  # Pass the full serialized message
            }
            
            # Send AI response to WebSocket group
            async_to_sync(channel_layer.group_send)(room_group_name, event)
            print(f"AI response broadcasted to group {group.id}")
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to broadcast AI response via WebSocket: {e}")
    
    return ai_message