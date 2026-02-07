# QHacks 2026

# Authors: Siddharth Tiwari, Daniel Kwan, Ryan Li and Diego Gonzalez

# 🏆 MIDAS

**Touch Broken Tech. Restore to Gold.**

MIDAS is an AR-powered repair assistant that helps anyone diagnose and fix broken technology. By pointing your camera at a device, MIDAS identifies components, detects likely faults, and overlays step-by-step AR repair guidance—bringing back the Golden Age of hands-on, self-reliant repair using modern AI.

---

## ✨ Inspiration

In the Heathkit era, people built and repaired their own technology. Today, most devices are sealed, opaque, and disposable—fueling massive e-waste and learned helplessness.

**MIDAS revives that lost self-reliance** by making repairs accessible, visual, and confidence-building through AI and augmented reality.

---

## 🔧 What It Does (MVP)

MIDAS v0 demonstrates an end-to-end repair experience for a **smartphone screen connector issue**:

1. 📷 **Scan** a broken phone using the camera
2. 🧠 **Recognize** the device and key components
3. 🚨 **Diagnose** a likely fault (e.g. loose display connector)
4. 🧩 **Repair** with AR-guided 3D step-by-step instructions
5. ✨ **Verify** the fix and “Restore to Gold”

---

## 🧠 How It Works

* **Computer Vision** detects phone components in real time
* **Rule-based diagnosis** determines the most likely issue
* **AR overlays** align a 3D phone model to the real device
* **Animated repair steps** guide the user visually
* **Repair confirmation** contributes to a growing repair knowledge base

---

## 🛠️ Tech Stack

* **Unity (URP)**
* **AR Foundation + ARKit** for augmented reality
* **YOLO (or mocked detection)** for component recognition
* **C#** for application logic
* **3D phone model + animations** for repair guidance

*(For hackathon stability, some AI components are partially simulated.)*

---

## 🚀 Getting Started

### Prerequisites

* macOS
* Unity Hub
* Xcode
* iPhone with ARKit support

### Setup

```bash
git clone https://github.com/your-team/midas.git
cd midas
```

1. Open the project in **Unity Hub**
2. Install:

   * AR Foundation
   * ARKit XR Plugin
3. Open the `MainScene`
4. Connect an iPhone and **Build & Run**

---

## 🧪 Demo Flow

1. Launch MIDAS on your phone
2. Tap **Scan Device**
3. Watch components get identified
4. View highlighted fault
5. Follow AR repair steps
6. See the **“Restored to Gold ✨”** success screen

---

## 🏅 Why MIDAS Wins

* 🧠 Combines AI + AR in a practical, human-centered way
* ♻️ Tackles e-waste and right-to-repair
* 👀 Extremely visual and demo-friendly
* 📈 Scales to cars, appliances, industrial hardware
* 🛠️ Encourages learning, not replacement

---

## 🔮 Future Work

* Multi-device support (laptops, cars, appliances)
* Crowdsourced repair success data
* Voice-guided repair steps
* Beginner vs expert modes
* Global map of devices saved from landfill

---

## 👥 Team

Built with ❤️ during a hackathon by a team that believes broken tech deserves a second life.

---


