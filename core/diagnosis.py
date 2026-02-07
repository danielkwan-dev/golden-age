import base64
import numpy as np
import cv2
from ultralytics import YOLO
from PIL import Image
import io
import logging

# --- THE VISION OF MIDAS ---
# Perceiving the broken, seeing the potential for gold.
# "Touch Broken Tech. Restore to Gold."

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MIDAS_VISION")

# Load the Oracle
try:
    model = YOLO("models/midas_yolo.pt")
except Exception as e:
    logger.warning(f"Oracle weight not found at models/midas_yolo.pt. Using default YOLOv11n. Error: {e}")
    model = YOLO("yolo11n.pt") 

def decode_base64_image(base64_str: str):
    """Safely extract the essence of the digital vision."""
    if "base64," in base64_str:
        base64_str = base64_str.split("base64,")[1]
    
    img_data = base64.b64decode(base64_str)
    img_array = np.frombuffer(img_data, dtype=np.uint8)
    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return image

def analyze_image(base64_image: str, device_category: str = None):
    """
    Perform the Midas Touch: Detect components and identify their suffering.
    """
    img = decode_base64_image(base64_image)
    if img is None:
        raise ValueError("The vision is blurred. Could not decode base64 image.")

    # Inference: Seeking anomalies in the machine
    results = model(img)
    
    detections = []
    faults = []
    
    # Process results from the Oracle
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
            
            detections.append({
                "label": label,
                "confidence": conf,
                "bbox": xyxy
            })
            
            # Heuristic for the Golden Age: 
            # In a production environment, 'fault' would be a specific YOLO class.
            if "burnt" in label or "cracked" in label or "missing" in label:
                faults.append({
                    "type": label,
                    "confidence": conf,
                    "bbox": xyxy
                })

    # Synthesize the diagnosis
    if not faults:
        # If no specific fault detected, we look for the component with lowest health
        main_fault = "Checking component integrity..."
        confidence = 1.0
        if detections:
            main_fault = f"Potential issue detected in {detections[0]['label']}"
            confidence = detections[0]['confidence']
    else:
        # Prioritize the most certain fault
        top_fault = max(faults, key=lambda x: x['confidence'])
        main_fault = top_fault['type']
        confidence = top_fault['confidence']

    return {
        "diagnosis": main_fault,
        "confidence": round(confidence, 4),
        "detections": detections,
        "faults": faults
    }
