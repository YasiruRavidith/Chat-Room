#!/usr/bin/env python
"""
Alternative way to run the Django ASGI application with Uvicorn
Use this if you specifically need Uvicorn instead of Django's runserver
"""

import os
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    
    # Initialize Django
    django.setup()
    
    # Run with uvicorn
    import uvicorn
    from backend.asgi import application
    
    uvicorn.run(
        application,
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )