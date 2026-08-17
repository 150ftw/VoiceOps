import sys
import os

# Add apps/api to sys.path so 'import app' works if Vercel deploys from the repo root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
api_dir = os.path.join(base_dir, 'apps', 'api')
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

try:
    from app.main import app
except ImportError:
    import sys
    sys.path.insert(0, os.path.join(os.getcwd(), 'apps', 'api'))
    from app.main import app

# Vercel ASGI Application Handler
