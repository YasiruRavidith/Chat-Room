#!/usr/bin/env python
"""
Quick test to check if Google GenAI is working
"""
try:
    from google import genai
    from google.genai import types
    print("✅ google-genai package imported successfully!")
    
    # Test basic client initialization (without API key for now)
    print("Package is available and ready to use.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("google-genai package may not be installed properly")
    
except Exception as e:
    print(f"❌ Other error: {e}")
