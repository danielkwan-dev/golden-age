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
import argparse
from typing import List, Optional

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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


def init_server():
    """Initialize the vision advisor."""
    global vision_advisor

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        vision_advisor = VisionAdvisor()
        print("MIDAS server ready (GPT-4o Vision)")
    else:
        print("ERROR: OPENAI_API_KEY not set — server cannot analyze images")


def preprocess_frame(image_bytes: bytes) -> tuple[bytes, int, int, bool]:
    """
    OpenCV preprocessing pipeline for camera frames.

    Enhances the image before sending to GPT-4o for better damage detection:
    - Resize large images to save API tokens
    - Auto white-balance and contrast enhancement (CLAHE)
    - Sharpen to make cracks/scratches more visible

    Returns:
        (processed_jpeg_bytes, width, height, was_preprocessed)
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return image_bytes, 0, 0, False

    h, w = frame.shape[:2]

    # Resize if too large (saves GPT-4o tokens, 1280px max dimension)
    max_dim = 1280
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        frame = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        h, w = frame.shape[:2]

    # Convert to LAB color space for contrast enhancement
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    # Apply CLAHE (adaptive histogram equalization) to the L channel
    # This enhances contrast locally — makes cracks and scratches more visible
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_channel)

    # Merge back and convert to BGR
    enhanced = cv2.merge([l_enhanced, a_channel, b_channel])
    frame = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # Light sharpen to make damage edges clearer
    kernel = np.array([
        [0, -0.5, 0],
        [-0.5, 3, -0.5],
        [0, -0.5, 0],
    ])
    frame = cv2.filter2D(frame, -1, kernel)

    # Encode back to JPEG
    _, jpeg_bytes = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

    return jpeg_bytes.tobytes(), w, h, True


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if vision_advisor is not None else "no_api_key",
        vision_ready=vision_advisor is not None,
    )


@app.post("/preview")
async def preview(image: UploadFile = File(...)):
    """
    OpenCV-only preprocessing — no GPT-4o call, no cost.

    Returns the enhanced JPEG image. The frontend can call this every ~2 seconds
    to show a live enhanced camera feed before the user triggers a full analysis.
    """
    raw_bytes = await image.read()
    processed_bytes, w, h, was_preprocessed = preprocess_frame(raw_bytes)

    return Response(
        content=processed_bytes,
        media_type="image/jpeg",
        headers={"X-Frame-Width": str(w), "X-Frame-Height": str(h)},
    )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    image: UploadFile = File(...),
    transcript: str = Form(default=""),
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
    processed_bytes, w, h, was_preprocessed = preprocess_frame(raw_bytes)

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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MIDAS Model Server")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    init_server()
    uvicorn.run(app, host=args.host, port=args.port)
