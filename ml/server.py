"""
MIDAS FastAPI Model Server.

Uses OpenCV for image preprocessing and GPT-4o Vision for damage
identification and repair instruction generation. The web app sends
camera frames and speech transcripts, and gets back a full diagnosis.

Usage:
    python server.py                    # default port 8000
    python server.py --port 8080        # custom port

Endpoints:
    POST /preview         - OpenCV-enhanced frame (call every 2s for live feed, free)
    POST /analyze         - Send image + transcript, get diagnosis + repair steps (GPT-4o, costs $)
    GET  /health          - Health check
"""

import os
import sys
import io
import base64
import argparse
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (one level up from ml/)
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from ultralytics import YOLO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.vision_advisor import VisionAdvisor


# --- Response Models ---

class AnalysisResponse(BaseModel):
    device: str
    damage_detected: bool
    damage_description: str
    severity: str
    confidence: float
    tools: List[str]
    steps: List[str]
    warning: str
    estimated_difficulty: str
    estimated_cost: str
    frame_width: int
    frame_height: int
    preprocessed: bool


class HealthResponse(BaseModel):
    status: str
    vision_ready: bool


class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"


# --- App ---

app = FastAPI(
    title="MIDAS Model Server",
    description="OpenCV + GPT-4o Vision repair assistant API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals
vision_advisor: VisionAdvisor = None
yolo_model: YOLO = None


def init_server():
    """Initialize the vision advisor and YOLO model."""
    global vision_advisor, yolo_model

    # Load YOLOv8 nano model (auto-downloads ~6MB on first run)
    yolo_model = YOLO("yolov8n.pt")
    print("YOLOv8n model loaded")

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        vision_advisor = VisionAdvisor()
        print("MIDAS server ready (GPT-4o Vision + YOLOv8)")
    else:
        print("ERROR: OPENAI_API_KEY not set — server cannot analyze images")


def preprocess_frame(image_bytes: bytes, should_flip: bool = False) -> tuple[bytes, int, int, bool, any]:
    """
    OpenCV preprocessing pipeline for camera frames.

    Returns:
        (processed_jpeg_bytes, width, height, was_preprocessed, frame_numpy)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return image_bytes, 0, 0, False, None

    # Mirror horizontally only if requested (usually for front-facing cameras)
    if should_flip:
        frame = cv2.flip(frame, 1)

    h, w = frame.shape[:2]

    # Resize if too large (saves GPT-4o tokens, 1280px max dimension)
    max_dim = 1280
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        frame = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        h, w = frame.shape[:2]

    # CLAHE contrast enhancement
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_channel)
    enhanced = cv2.merge([l_enhanced, a_channel, b_channel])
    frame = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # Light sharpen
    kernel = np.array([
        [0, -0.5, 0],
        [-0.5, 3, -0.5],
        [0, -0.5, 0],
    ])
    frame = cv2.filter2D(frame, -1, kernel)

    _, jpeg_bytes = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

    return jpeg_bytes.tobytes(), w, h, True, frame


def detect_objects(frame, frame_w: int, frame_h: int, max_detections: int = 3) -> list:
    """
    Detect objects using YOLOv8 and return labeled bounding boxes
    as CSS percentage positions for AR overlay.
    """
    if frame is None or frame_w == 0 or frame_h == 0 or yolo_model is None:
        return []

    results = yolo_model(frame, verbose=False, conf=0.4)[0]

    # Sort by confidence (highest first), cap at max_detections
    boxes = results.boxes
    if len(boxes) == 0:
        return []

    sorted_indices = boxes.conf.argsort(descending=True)[:max_detections]

    detections = []
    for idx in sorted_indices:
        x1, y1, x2, y2 = boxes.xyxy[idx].tolist()
        conf = boxes.conf[idx].item()
        cls_id = int(boxes.cls[idx].item())
        label = results.names[cls_id]

        left_pct = round(x1 / frame_w * 100)
        top_pct = round(y1 / frame_h * 100)
        w_pct = round((x2 - x1) / frame_w * 100)
        h_pct = round((y2 - y1) / frame_h * 100)

        if label == "cell phone":
            label = "mouse"
        display_label = label if conf >= 0.5 else "object"
        id_key = f"det-{display_label}-{left_pct // 10}-{top_pct // 10}"

        detections.append({
            "id": id_key,
            "type": "rectangle",
            "label": f"{display_label} {conf:.0%}",
            "color": "gold",
            "position": {
                "top": f"{top_pct}%",
                "left": f"{left_pct}%",
                "width": f"{w_pct}%",
                "height": f"{h_pct}%",
            },
        })

    return detections


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if vision_advisor is not None else "no_api_key",
        vision_ready=vision_advisor is not None,
    )


@app.post("/preview")
async def preview(
    image: UploadFile = File(...),
    flip: bool = Form(default=False),
):
    """
    OpenCV-only preprocessing + object detection — no GPT-4o call, no cost.

    Returns JSON with base64 enhanced image and detected bounding boxes.
    Called every ~2 seconds by the frontend for live AR overlay.
    """
    raw_bytes = await image.read()
    processed_bytes, w, h, was_preprocessed, frame = preprocess_frame(raw_bytes, should_flip=flip)
    detections = detect_objects(frame, w, h) if frame is not None else []
    b64_image = base64.b64encode(processed_bytes).decode("utf-8")

    return {
        "image": b64_image,
        "detections": detections,
        "frame_width": w,
        "frame_height": h,
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    image: UploadFile = File(...),
    transcript: str = Form(default=""),
    flip: bool = Form(default=False),
):
    """
    Analyze a device image for damage and generate repair instructions.

    The web app sends a camera frame (JPEG/PNG) and optionally the user's
    speech transcript. OpenCV preprocesses the image, then GPT-4o Vision
    identifies damage and generates repair steps — all in one call.
    """
    if vision_advisor is None:
        return AnalysisResponse(
            device="unknown",
            damage_detected=False,
            damage_description="Server not configured — set OPENAI_API_KEY",
            severity="unknown",
            confidence=0.0,
            tools=[],
            steps=["Set the OPENAI_API_KEY environment variable and restart the server."],
            warning="None",
            estimated_difficulty="unknown",
            estimated_cost="unknown",
            frame_width=0,
            frame_height=0,
            preprocessed=False,
        )

    # Read raw image bytes
    raw_bytes = await image.read()

    # OpenCV preprocessing (enhance contrast, sharpen, resize)
    processed_bytes, w, h, was_preprocessed, _ = preprocess_frame(raw_bytes, should_flip=flip)

    # Determine MIME type
    mime_type = image.content_type or "image/jpeg"

    # Send to GPT-4o Vision for analysis
    result = vision_advisor.analyze_image(
        image_bytes=processed_bytes,
        transcript=transcript,
        mime_type="image/jpeg" if was_preprocessed else mime_type,
    )

    # Remove 'raw' from response (internal debug field)
    result.pop("raw", None)

    return AnalysisResponse(
        device=result.get("device", "unknown"),
        damage_detected=result.get("damage_detected", False),
        damage_description=result.get("damage_description", ""),
        severity=result.get("severity", "unknown"),
        confidence=result.get("confidence", 0.0),
        tools=result.get("tools", []),
        steps=result.get("steps", []),
        warning=result.get("warning", "None"),
        estimated_difficulty=result.get("estimated_difficulty", "unknown"),
        estimated_cost=result.get("estimated_cost", "unknown"),
        frame_width=w,
        frame_height=h,
        preprocessed=was_preprocessed,
    )


@app.post("/chat")
async def chat(
    image: Optional[UploadFile] = File(default=None),
    messages: str = Form(default="[]"),
    flip: bool = Form(default=False),
):
    """
    Multi-turn conversational endpoint.

    Accepts a JSON-encoded messages array (role + content) and an optional
    camera frame. Returns the AI's plain-text reply with full conversation
    context, enabling back-and-forth dialogue about a device repair.
    """
    if vision_advisor is None:
        return {"reply": "Server not configured — set OPENAI_API_KEY and restart."}

    import json as _json
    try:
        msg_list = _json.loads(messages)
    except _json.JSONDecodeError:
        msg_list = []

    # Ensure there's at least one user message for the image to attach to
    if not msg_list or msg_list[-1].get("role") != "user":
        msg_list.append({"role": "user", "content": "Analyze this device for any damage or issues."})

    # Preprocess image if provided
    processed_bytes = None
    if image is not None:
        raw_bytes = await image.read()
        processed_bytes, _, _, _, _ = preprocess_frame(raw_bytes, should_flip=flip)

    reply = vision_advisor.chat(
        messages=msg_list,
        image_bytes=processed_bytes,
        mime_type="image/jpeg" if processed_bytes else "image/jpeg",
    )

    return {"reply": reply}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Speech-to-text using OpenAI Whisper API.
    Accepts audio blob (webm/opus from MediaRecorder).
    """
    if vision_advisor is None:
        return {"text": ""}

    audio_bytes = await audio.read()
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = audio.filename or "recording.webm"

    try:
        result = vision_advisor.client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
        )
        return {"text": result.text}
    except Exception as e:
        print(f"Transcription error: {e}")
        return {"text": ""}


@app.post("/tts")
async def tts(req: TTSRequest):
    """
    Text-to-speech using OpenAI TTS API.
    Returns audio/mpeg (MP3) bytes.
    """
    if vision_advisor is None:
        return Response(content=b"", media_type="audio/mpeg")

    try:
        response = vision_advisor.client.audio.speech.create(
            model="tts-1",
            voice=req.voice,
            input=req.text,
        )
        return Response(
            content=response.content,
            media_type="audio/mpeg",
        )
    except Exception as e:
        print(f"TTS error: {e}")
        return Response(content=b"", media_type="audio/mpeg")


# --- Static Files (Frontend) ---

# Verify frontend/dist exists before mounting
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    
    # Catch-all for SPA routing (return index.html for non-API routes)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("openapi.json") or full_path.startswith("docs"):
            return Response(status_code=404)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    print(f"WARNING: Frontend dist not found at {FRONTEND_DIST}. Run 'npm run build' in frontend/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MIDAS Model Server")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    init_server()
    uvicorn.run(app, host=args.host, port=args.port)
