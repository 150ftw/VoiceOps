import sys
import os

# Add root of apps/api to sys.path so 'import app' works in Vercel serverless environment
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.main import app

# Vercel ASGI Application Handler
