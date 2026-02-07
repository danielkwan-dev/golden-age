# QHacks 2026

# Authors: Siddharth Tiwari, Daniel Kwan, Ryan Li and Diego Gonzalez
=======
# MIDAS Backend: The Golden Age of Repair

**"Touch Broken Tech. Restore to Gold."**

This is the FastAPI backend for MIDAS, an AR-powered repair application that uses computer vision to diagnose hardware faults and provide real-time AR repair instructions.

## 🛠 Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **AI/CV**: Ultralytics YOLOv11 (Inference) + OpenCV
- **Database**: Supabase (PostgreSQL via SQLAlchemy)
- **Deployment**: Vercel Serverless

## 📂 Project Structure
```text
midas-backend/
├── main.py             # FastAPI entry point & routes
├── models/
│   └── midas_yolo.pt   # Fine-tuned YOLOv11 weights (Place your model here)
├── core/
│   ├── diagnosis.py    # YOLO inference & image processing
│   ├── repair_steps.py # AR step generation logic
│   └── db.py           # Supabase/SQLAlchemy initialization
├── requirements.txt    # Production dependencies
└── vercel.json         # Serverless configuration
```

## 🚀 Getting Started

### 1. Configure Environment
Create a `.env` file or export the following:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_KEY=[YOUR_ANON_KEY]
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Locally
```bash
uvicorn main.py --reload
```
The API will be live at `http://localhost:8000`. 
Documentation is available at `/docs`.

## 📡 API Endpoints

### `POST /diagnose`
Accepts a base64 encoded image and returns a detailed diagnosis with AR repair steps.
**Request Body:**
```json
{
  "base64_image": "data:image/jpeg;base64,...",
  "device_category": "Fender Twin Reverb"
}
```

### `GET /health`
Returns the status of the Golden Empire.

## 🔮 Training Your Oracle

If you wish to fine-tune the YOLOv11 model for your specific device faults:

1. **Prepare Dataset**: 
   - Create a `datasets/` folder.
   - Organize into `images/train`, `images/val` and `labels/train`, `labels/val`.
   - Your labels should be in **YOLO format** (.txt files with `class_id x_center y_center width height`).

2. **Configure Categories**: 
   - Update `data.yaml` with your custom classes if they differ from the defaults.

3. **Ignite the Forge**:
   ```bash
   python train.py
   ```
   *Note: This defaults to CPU. If you have a CUDA GPU, change `device=0` in `train.py`.*

4. **Evolution**: 
   - Once complete, the best weights will be automatically moved to `models/midas_yolo.pt`, and your FastAPI backend will pick them up on the next restart.

---
*Created for the Golden Age of Repair.*
>>>>>>> a886157 (Initial commit: Golden Age of Repair Backend)
