import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.reconstruction import generate_3d_mesh
from services.storage import STORAGE_PATH

DEFAULT_IMAGE = os.path.join(STORAGE_PATH, "uploads", "default_bike.jpg")

if __name__ == "__main__":
    print(f"Generating from {DEFAULT_IMAGE}")
    generate_3d_mesh(DEFAULT_IMAGE, "default_bike")
