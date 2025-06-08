#!/usr/bin/env python
"""
Proper ASGI server startup for WebSocket support
Use this instead of 'python manage.py runserver' for full WebSocket functionality
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django
django.setup()

if __name__ == '__main__':
    try:
        import uvicorn
        
        print("🚀 Starting Django ASGI server with WebSocket support...")
        print("📡 WebSocket endpoints available:")
        print("   - ws://127.0.0.1:8000/ws/notifications/")
        print("   - ws://127.0.0.1:8000/ws/chat/{group_id}/")
        print("🌐 HTTP API available at: http://127.0.0.1:8000/")
        print("🔧 Admin panel: http://127.0.0.1:8000/admin/")
        print("\n💡 Use Ctrl+C to stop the server")
        
        uvicorn.run(
            "backend.asgi:application",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
        
    except ImportError:
        print("❌ Uvicorn not installed. Installing...")
        os.system("pip install uvicorn")
        print("✅ Please run the script again")
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("\n🔧 Fallback: Try running 'python manage.py runserver' instead")
