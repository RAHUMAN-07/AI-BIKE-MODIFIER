# Object detection service to identify motorcycle parts using YOLOv8.
# Falls back to heuristics based on bounding box aspect ratio and position.
# Also extracts dominant colors from the image based on parts' bounding boxes/regions.

import os
from PIL import Image

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

def extract_bike_colors(image_path: str, bbox=None) -> dict:
    """
    Extract average colors of specific parts by looking at sub-regions 
    of the detected motorcycle bounding box.
    """
    colors = {}
    try:
        img = Image.open(image_path)
        
        if bbox:
            xmin, ymin, xmax, ymax = bbox
            xmin = max(0, xmin)
            ymin = max(0, ymin)
            xmax = min(img.width, xmax)
            ymax = min(img.height, ymax)
            if xmax > xmin and ymax > ymin:
                img = img.crop((xmin, ymin, xmax, ymax))

        def get_avg_color(box_pct):
            w, h = img.size
            x0 = int(box_pct[0] * w)
            y0 = int(box_pct[1] * h)
            x1 = int(box_pct[2] * w)
            y1 = int(box_pct[3] * h)
            
            x0 = max(0, min(w - 1, x0))
            y0 = max(0, min(h - 1, y0))
            x1 = max(0, min(w - 1, x1))
            y1 = max(0, min(h - 1, y1))
            
            if x1 <= x0 or y1 <= y0:
                return "#808080"
                
            cropped = img.crop((x0, y0, x1, y1))
            
            if cropped.mode == 'RGBA':
                pixels = list(cropped.getdata())
                non_transparent = [p[:3] for p in pixels if p[3] > 40]
                if non_transparent:
                    r = sum(p[0] for p in non_transparent) // len(non_transparent)
                    g = sum(p[1] for p in non_transparent) // len(non_transparent)
                    b = sum(p[2] for p in non_transparent) // len(non_transparent)
                    return f"#{r:02x}{g:02x}{b:02x}"
            
            rgb_cropped = cropped.convert('RGB')
            one_pix = rgb_cropped.resize((1, 1), Image.Resampling.LANCZOS)
            r, g, b = one_pix.getpixel((0, 0))
            return f"#{r:02x}{g:02x}{b:02x}"

        body_color = get_avg_color([0.35, 0.15, 0.65, 0.40])
        frame_color = get_avg_color([0.30, 0.45, 0.70, 0.70])
        seat_color = get_avg_color([0.15, 0.35, 0.45, 0.50])
        wheel_color = get_avg_color([0.08, 0.60, 0.28, 0.90])
        exhaust_color = get_avg_color([0.15, 0.50, 0.50, 0.85])

        colors = {
            "fuel_tank": body_color,
            "fairing": body_color,
            "mudguard_front": body_color,
            "mudguard_rear": body_color,
            "frame": frame_color,
            "engine": frame_color,
            "chain_cover": frame_color,
            "seat": seat_color,
            "front_rim": wheel_color,
            "rear_rim": wheel_color,
            "handlebar": frame_color,
            "mirror_left": seat_color,
            "mirror_right": seat_color,
            "exhaust": exhaust_color,
            "front_wheel": "#1a1a1a",
            "rear_wheel": "#1a1a1a",
            "headlight": "#e5e7eb",
            "taillight": "#dc2626",
        }
    except Exception as e:
        print(f"Error in extract_bike_colors: {e}")
        colors = {
            "fuel_tank": "#dc2626",
            "fairing": "#1e40af",
            "seat": "#1a1a1a",
            "exhaust": "#c0c0c0",
            "frame": "#1a1a1a",
            "engine": "#6b7280",
            "front_wheel": "#1a1a1a",
            "rear_wheel": "#1a1a1a",
        }
    return colors

def detect_parts(image_path: str):
    """
    Given an image path, return a list of detected parts and extracted colors.
    """
    default_parts = [
        {"id": "fuel_tank", "name": "Fuel Tank", "confidence": 1.0},
        {"id": "seat", "name": "Seat", "confidence": 1.0},
        {"id": "exhaust", "name": "Exhaust", "confidence": 1.0},
        {"id": "handlebar", "name": "Handlebar", "confidence": 1.0},
        {"id": "front_wheel", "name": "Front Wheel", "confidence": 1.0},
        {"id": "rear_wheel", "name": "Rear Wheel", "confidence": 1.0},
        {"id": "engine", "name": "Engine", "confidence": 1.0},
        {"id": "frame", "name": "Frame", "confidence": 1.0},
    ]

    if not YOLO_AVAILABLE:
        print("WARNING: ultralytics package not available. Using fallback parts.")
        colors = extract_bike_colors(image_path, bbox=None)
        return {
            "parts": default_parts,
            "colors": colors
        }

    try:
        _backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        _model_path = os.path.join(_backend_root, "yolov8n.pt")
        model = YOLO(_model_path)
        results = model(image_path, verbose=False)
        
        if not results or len(results) == 0:
            colors = extract_bike_colors(image_path, bbox=None)
            return {
                "parts": default_parts,
                "colors": colors
            }
            
        result = results[0]
        boxes = result.boxes
        
        motorcycle_box = None
        max_conf = 0.0
        
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            if cls_id == 3 and conf > max_conf:
                max_conf = conf
                motorcycle_box = box.xyxy[0].tolist()

        if not motorcycle_box:
            print("WARNING: No motorcycle detected in image. Using fallback parts.")
            colors = extract_bike_colors(image_path, bbox=None)
            return {
                "parts": default_parts,
                "colors": colors
            }

        xmin, ymin, xmax, ymax = motorcycle_box
        width = xmax - xmin
        height = ymax - ymin
        aspect_ratio = width / height if height > 0 else 1.0

        colors = extract_bike_colors(image_path, bbox=motorcycle_box)

        part_ids = ["fuel_tank", "seat", "exhaust", "engine", "frame", "front_wheel", "rear_wheel"]
        
        if aspect_ratio > 1.2:
            part_ids.extend([
                "front_rim", "rear_rim", 
                "mudguard_front", "mudguard_rear", 
                "chain_cover", "fairing",
                "handlebar", "mirror_left", "mirror_right"
            ])
        elif aspect_ratio < 0.9:
            part_ids.extend(["handlebar", "mirror_left", "mirror_right", "headlight", "taillight"])
        else:
            part_ids.extend([
                "handlebar", "mirror_left", "mirror_right", 
                "headlight", "front_rim", "rear_rim", 
                "mudguard_front", "mudguard_rear"
            ])

        detected_parts = []
        for pid in part_ids:
            name = pid.replace("_", " ").title()
            detected_parts.append({
                "id": pid,
                "name": name,
                "confidence": round(max_conf, 2)
            })
            
        return {
            "parts": detected_parts,
            "colors": colors
        }

    except Exception as e:
        print(f"Error in YOLO object detection: {e}. Using fallback parts.")
        colors = extract_bike_colors(image_path, bbox=None)
        return {
            "parts": default_parts,
            "colors": colors
        }
