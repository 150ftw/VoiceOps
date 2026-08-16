import sys
import os

# Set VERCEL environment marker
os.environ["VERCEL"] = "1"

# Add paths for Vercel Serverless Function imports
curr_dir = os.path.dirname(os.path.abspath(__file__))
api_dir = os.path.join(curr_dir, "..", "apps", "api")
if os.path.exists(api_dir) and api_dir not in sys.path:
    sys.path.insert(0, api_dir)

apps_api_dir = os.path.join(os.getcwd(), "apps", "api")
if os.path.exists(apps_api_dir) and apps_api_dir not in sys.path:
    sys.path.insert(0, apps_api_dir)

from app.main import app
