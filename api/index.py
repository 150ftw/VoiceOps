import sys
import os

# Add apps/api to path for Vercel Python Serverless Function discovery
curr_dir = os.path.dirname(os.path.abspath(__file__))
api_dir = os.path.join(curr_dir, "..", "apps", "api")
if os.path.exists(api_dir):
    sys.path.insert(0, api_dir)

try:
    from app.main import app
except ImportError:
    import sys
    sys.path.insert(0, os.path.join(os.getcwd(), "apps", "api"))
    from app.main import app

# Handler export for Vercel
app = app
