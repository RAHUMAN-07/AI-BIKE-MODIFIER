import sys
import os

# Add parent directory (backend root) to sys.path so imports work properly on Vercel
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
