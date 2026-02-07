"""
Extra image transforms for MIDAS data preprocessing.

Note: YOLOv11 (ultralytics) handles its own training augmentations internally.
These utilities are for custom preprocessing outside the YOLO pipeline,
e.g. preparing frames before inference or augmenting data for export.
"""

import cv2
import numpy as np


def letterbox(image: np.ndarray, target_size: int = 640) -> tuple:
    """
    Resize image with letterboxing (preserve aspect ratio, pad with gray).
    Returns (resized_image, scale, pad_x, pad_y) for mapping coords back.
    """
    h, w = image.shape[:2]
    scale = min(target_size / h, target_size / w)
    new_w, new_h = int(w * scale), int(h * scale)

    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    pad_x = (target_size - new_w) // 2
    pad_y = (target_size - new_h) // 2

    canvas = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
    canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = resized

    return canvas, scale, pad_x, pad_y


def map_bbox_to_original(bbox, scale, pad_x, pad_y):
    """Map a bounding box from letterboxed coords back to original image coords."""
    x1, y1, x2, y2 = bbox
    x1 = (x1 - pad_x) / scale
    y1 = (y1 - pad_y) / scale
    x2 = (x2 - pad_x) / scale
    y2 = (y2 - pad_y) / scale
    return int(x1), int(y1), int(x2), int(y2)
