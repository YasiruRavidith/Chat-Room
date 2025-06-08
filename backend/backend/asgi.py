# backend/asgi.py

import os
import django

# Set Django settings module BEFORE any Django imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django BEFORE importing any Django-related code
django.setup()

# Now safe to import Django and channels code
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from main.middleware import JWTAuthMiddlewareStack
from main.routing import websocket_urlpatterns

# Get the Django ASGI application
django_asgi_app = get_asgi_application()

# Debug: Print websocket patterns
print("🔍 WebSocket URL patterns:", websocket_urlpatterns)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

print("✅ ASGI Application configured with WebSocket support")