import logging
import time
from fastapi import FastAPI, HTTPException, Body, Depends, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from core.diagnosis import analyze_image
from core.repair_steps import generate_steps, get_tools_needed
from core.db import SessionLocal, RepairRecord, init_db
from sqlalchemy.orm import Session

# --- THE HEART OF MIDAS ---
# Routing the flow of gilded restoration.
# Gold is the standard. Excellence is the mandate.

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MIDAS_CORE")

app = FastAPI(
    title="MIDAS Backend",
    description="The Golden Age of Repair API. Powered by Vision and Precision.",
    version="1.1.0"
)

# Allow the Flutter scrolls to access our wisdom
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the DB connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Scrolls
class DiagnosisRequest(BaseModel):
    base64_image: str
    device_category: Optional[str] = "General Electronics"

class OverlayElement(BaseModel):
    type: str
    bbox: List[float]
    text: str
    color: str

class RepairStep(BaseModel):
    step: int
    instruction: str
    tools: List[str]
    overlay: OverlayElement

class DiagnosisResponse(BaseModel):
    diagnosis: str
    confidence: float
    device: str
    repair_steps: List[RepairStep]
    overlay_elements: List[OverlayElement]
    tools_needed: List[str]
    processing_time: float

@app.on_event("startup")
def startup_event():
    logger.info("MIDAS Backend Ignition...")
    try:
        init_db()
        logger.info("Database Ledger Synchronized.")
    except Exception as e:
        logger.error(f"Failed to synchronize database: {e}")

@app.get("/health", tags=["Vitality"])
async def health_check():
    """Verify the health of the Golden Empire."""
    return {"status": "golden", "timestamp": time.time()}

@app.post("/diagnose", response_model=DiagnosisResponse, tags=["Restoration"])
async def diagnose_device(request: DiagnosisRequest, db: Session = Depends(get_db)):
    """
    Analyze the suffering of a device and provide the path to restoration.
    """
    start_time = time.time()
    logger.info(f"Incoming diagnosis request for category: {request.device_category}")

    try:
        # Perform Vision Analysis
        analysis = analyze_image(request.base64_image, request.device_category)
        
        # Determine the steps to gold
        fault_type = analysis["diagnosis"]
        # Use the first fault's bbox if available, otherwise use a detected component
        bbox = analysis["faults"][0]["bbox"] if analysis["faults"] else (analysis["detections"][0]["bbox"] if analysis["detections"] else [0,0,10,10])
        
        steps = generate_steps(fault_type, bbox)
        tools = get_tools_needed(steps)
        
        # Extract overlay elements for quick AR access
        overlays = [step["overlay"] for step in steps]

        processing_time = time.time() - start_time
        
        # Record the repair in the Eternal Archive
        new_repair = RepairRecord(
            device_model=request.device_category,
            fault=fault_type,
            confidence=int(analysis["confidence"] * 1000),
            steps=steps,
            success=True
        )
        db.add(new_repair)
        db.commit()

        return {
            "diagnosis": fault_type,
            "confidence": analysis["confidence"],
            "device": request.device_category,
            "repair_steps": steps,
            "overlay_elements": overlays,
            "tools_needed": tools,
            "processing_time": processing_time
        }

    except Exception as e:
        logger.error(f"Restoration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repair-history/{device_id}", tags=["Archive"])
async def get_repair_history(device_id: str, db: Session = Depends(get_db)):
    """Retrieve past triumphs of restoration."""
    history = db.query(RepairRecord).filter(RepairRecord.device_id == device_id).all()
    return history

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
