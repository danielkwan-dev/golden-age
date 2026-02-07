"""
MIDAS FastAPI Model Server.

Serves the trained YOLOv11 model over HTTP. The Unity AR app sends video
frames to the /detect endpoint and gets back detection results as JSON.

Usage:
    python server.py                                    # default port 8000
    python server.py --port 8080                        # custom port
    python server.py --model runs/train/weights/best.pt # custom model

Endpoints:
    POST /detect          - Send an image, get back detections + repair info
    POST /context         - Send speech transcript to update detection context
    GET  /health          - Health check
    GET  /classes         - List all fault classes
"""

import os
import sys
import io
import argparse
from typing import List, Optional

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from configs.config import load_config
from utils.repair_kb import get_repair_info
from utils.speech_context import SpeechContext


# --- Response Models ---

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    center_x: int
    center_y: int
    width: int
    height: int


class RepairInfo(BaseModel):
    severity: str
    tools: List[str]
    steps: List[str]


class Detection(BaseModel):
    class_id: int
    label: str
    confidence: float
    bbox: BoundingBox
    repair_info: RepairInfo
    speech_match: bool = False


class DetectionResponse(BaseModel):
    detections: List[Detection]
    frame_width: int
    frame_height: int
    speech_context: Optional[str] = None


class ContextRequest(BaseModel):
    transcript: str


class ContextResponse(BaseModel):
    status: str
    context_summary: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    classes: int


# --- App ---

app = FastAPI(
    title="MIDAS Model Server",
    description="YOLOv11 fault detection API for the MIDAS AR repair assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals (initialized in startup)
model: YOLO = None
config = None
speech_ctx: SpeechContext = None
fault_classes: List[str] = []


def init_model(model_path: str, config_path: str = None):
    """Load the YOLO model and config."""
    global model, config, speech_ctx, fault_classes

    config = load_config(config_path)
    fault_classes = config.fault_classes
    speech_ctx = SpeechContext(boost_factor=0.15, decay=0.85)

    if not os.path.exists(model_path):
        print(f"Warning: model not found at {model_path}")
        print("Train a model first with: python train.py")
        return

    model = YOLO(model_path)
    print(f"Model loaded: {model_path}")
    print(f"Classes ({len(fault_classes)}): {fault_classes}")


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if model is not None else "no_model",
        model_loaded=model is not None,
        classes=len(fault_classes),
    )


@app.get("/classes")
def get_classes():
    return {
        "classes": {i: name for i, name in enumerate(fault_classes)},
        "total": len(fault_classes),
    }


@app.post("/detect", response_model=DetectionResponse)
async def detect(
    image: UploadFile = File(...),
    apply_speech_context: bool = Form(default=True),
):
    """
    Run fault detection on an uploaded image frame.

    The Unity app should send camera frames here as JPEG/PNG.
    Returns bounding boxes, fault labels, confidence scores,
    and repair instructions for each detection.
    """
    if model is None:
        return DetectionResponse(
            detections=[], frame_width=0, frame_height=0,
            speech_context="Model not loaded",
        )

    # Read image bytes
    contents = await image.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    frame = np.array(pil_image)
    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

    h, w = frame.shape[:2]

    # Run YOLO detection
    results = model.predict(
        source=frame,
        conf=config.inference.confidence_threshold,
        iou=config.inference.iou_threshold,
        max_det=config.inference.max_detections,
        device=config.inference.device,
        verbose=False,
    )

    detections = []
    if results and len(results) > 0:
        result = results[0]
        if result.boxes is not None:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

                label = fault_classes[cls_id] if cls_id < len(fault_classes) else "unknown"
                repair = get_repair_info(label)

                detections.append({
                    "class_id": cls_id,
                    "label": label,
                    "confidence": conf,
                    "bbox": (x1, y1, x2, y2),
                    "repair_info": repair,
                    "speech_match": False,
                })

    # Apply speech context if enabled
    if apply_speech_context and speech_ctx:
        detections = speech_ctx.adjust_detections(detections)
        speech_ctx.tick()

    # Format response
    formatted = []
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        formatted.append(Detection(
            class_id=det["class_id"],
            label=det["label"],
            confidence=round(det["confidence"], 4),
            bbox=BoundingBox(
                x1=x1, y1=y1, x2=x2, y2=y2,
                center_x=(x1 + x2) // 2,
                center_y=(y1 + y2) // 2,
                width=x2 - x1,
                height=y2 - y1,
            ),
            repair_info=RepairInfo(**det["repair_info"]),
            speech_match=det.get("speech_match", False),
        ))

    context_summary = speech_ctx.get_context_summary() if speech_ctx else None

    return DetectionResponse(
        detections=formatted,
        frame_width=w,
        frame_height=h,
        speech_context=context_summary,
    )


@app.post("/context", response_model=ContextResponse)
async def update_context(req: ContextRequest):
    """
    Update the speech context with a new transcript chunk.

    The Unity app should send Whisper transcripts here so that
    speech context can boost/suppress detection results.
    """
    if speech_ctx is None:
        return ContextResponse(status="error", context_summary="Not initialized")

    speech_ctx.update(req.transcript)
    return ContextResponse(
        status="ok",
        context_summary=speech_ctx.get_context_summary(),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MIDAS Model Server")
    parser.add_argument("--model", type=str, default=None,
                        help="Path to trained YOLO model (.pt or .onnx)")
    parser.add_argument("--config", type=str, default=None,
                        help="Path to config YAML")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.model is None:
        ml_root = os.path.dirname(os.path.abspath(__file__))
        args.model = os.path.join(ml_root, "runs", "train", "weights", "best.pt")

    init_model(args.model, args.config)
    uvicorn.run(app, host=args.host, port=args.port)
