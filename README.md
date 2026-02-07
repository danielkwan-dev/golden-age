# QHacks 2026

# Authors: Siddharth Tiwari, Daniel Kwan, Ryan Li and Diego Gonzalez

# MIDAS

**Touch Broken Tech. Restore to Gold.**

MIDAS is an AR-powered repair assistant that helps anyone diagnose and fix broken technology. By pointing your camera at a device, MIDAS identifies components, detects likely faults, and overlays step-by-step AR repair guidance—bringing back the Golden Age of hands-on, self-reliant repair using modern AI.

---

## Inspiration

In the Heathkit era, people built and repaired their own technology. Today, most devices are sealed, opaque, and disposable—fueling massive e-waste and learned helplessness.

**MIDAS revives that lost self-reliance** by making repairs accessible, visual, and confidence-building through AI and augmented reality.

---

## What It Does (MVP)

MIDAS v0 demonstrates an end-to-end repair experience for a **smartphone screen connector issue**:

1. **Scan** a broken phone using the camera
2. **Recognize** the device and key components
3. **Diagnose** a likely fault (e.g. loose display connector)
4. **Repair** with AR-guided step-by-step instructions
5. **Verify** the fix and "Restore to Gold"

---

## Tech Stack

- **Frontend**: React + Vite (mobile web app)
- **Backend**: FastAPI (Python 3.10+)
- **AI/CV**: YOLOv11 (Ultralytics) + OpenCV
- **LLM**: OpenAI GPT for dynamic repair instructions
- **Speech**: Whisper / Web Speech API for voice context
- **Database**: Supabase (PostgreSQL via SQLAlchemy)

---

## Project Structure
```text
golden-age/
├── frontend/               # React + Vite web app
│   ├── src/
│   │   ├── components/     # UI components (CameraFeed, VoiceOrb, etc.)
│   │   ├── hooks/          # useCamera, useMicrophone, useRepairSession
│   │   └── data/           # Mock data for development
│   └── package.json
├── ml/                     # Machine learning pipeline
│   ├── configs/            # YAML config + loader
│   ├── data/               # Dataset merge scripts
│   ├── utils/              # Speech context, overlay, repair KB, LLM advisor
│   ├── train.py            # YOLOv11 training
│   ├── inference.py        # Local video inference demo
│   └── server.py           # FastAPI model server
├── core/                   # Backend diagnosis + repair logic
├── main.py                 # FastAPI entry point
└── requirements.txt        # Python dependencies
```

---

## Getting Started

### Backend
```bash
pip install -r requirements.txt
cd ml
python data/merge_datasets.py
python train.py
python server.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

| Method | Endpoint   | Description |
|--------|-----------|-------------|
| POST   | /detect   | Send image, get damage detections |
| POST   | /repair   | Get LLM-generated repair instructions |
| POST   | /context  | Update speech context with transcript |
| GET    | /health   | Server health check |
| GET    | /classes  | List all fault classes |

---

## Future Work

- Multi-device support (laptops, cars, appliances)
- Crowdsourced repair success data
- Voice-guided repair steps
- Beginner vs expert modes

---

Built with care during QHacks 2026 by a team that believes broken tech deserves a second life.
