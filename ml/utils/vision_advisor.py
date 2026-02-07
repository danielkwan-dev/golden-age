"""
GPT-4o Vision-powered repair advisor.

Sends a camera frame + user speech transcript to GPT-4o, which handles
both damage identification AND repair instruction generation in one call.
Replaces the YOLO + speech context + LLM advisor pipeline.
"""

import base64
import json
import os
from typing import Optional

from openai import OpenAI

SYSTEM_PROMPT = """You are MIDAS, an AR-powered repair assistant. You analyze images of broken technology — any device — and provide repair guidance.

You can diagnose damage on ANY technology: mice, keyboards, laptops, phones, monitors, headphones, game controllers, cables, chargers, circuit boards, and more.

You receive:
1. A photo of a device (taken from a phone/webcam camera, preprocessed with OpenCV for enhanced visibility)
2. The user's spoken description of the problem (transcribed from speech)

Your job:
- Identify what device is shown in the image (be specific: e.g. "Logitech G502 gaming mouse", "Apple Magic Keyboard")
- Detect any visible damage or faults: broken switches, worn cables, cracked shells, stuck/missing keys, scroll wheel issues, broken mouse buttons, frayed wires, loose connectors, dead LEDs, etc.
- Provide clear, step-by-step repair instructions specific to that device type
- If the user mentioned additional context (e.g. "the left click double-clicks"), factor that in
- Keep steps concise and actionable — the user is reading these on a screen while repairing
- Warn about safety hazards (e.g. soldering near batteries, ESD damage to PCBs)
- If you see no damage, say so clearly

You MUST respond with valid JSON in this exact format (no markdown, no code fences):
{
    "device": "what the device is (e.g. Logitech G502 mouse, Corsair K70 keyboard, MacBook Pro)",
    "damage_detected": true or false,
    "damage_description": "1-2 sentence summary of visible damage",
    "severity": "none" or "low" or "moderate" or "high",
    "confidence": 0.0 to 1.0 how confident you are in your diagnosis,
    "tools": ["tool1", "tool2"],
    "steps": ["step 1", "step 2", "step 3"],
    "warning": "safety warnings, or 'None'",
    "estimated_difficulty": "beginner" or "intermediate" or "advanced",
    "estimated_cost": "rough cost estimate for parts if needed"
}"""


class VisionAdvisor:
    def __init__(self, model: str = "gpt-4o", api_key: str = None):
        self.model = model
        self.client = OpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"))

    def analyze_image(
        self,
        image_bytes: bytes,
        transcript: str = "",
        mime_type: str = "image/jpeg",
    ) -> dict:
        """
        Analyze a device image and generate repair instructions.

        Args:
            image_bytes: Raw image bytes (JPEG/PNG from camera).
            transcript: User's spoken description of the problem.
            mime_type: MIME type of the image.

        Returns:
            dict with diagnosis and repair instructions.
        """
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        user_content = []

        # Add the image
        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime_type};base64,{b64_image}",
                "detail": "high",
            },
        })

        # Add the user's spoken context
        if transcript:
            user_content.append({
                "type": "text",
                "text": f"The user says: \"{transcript}\"",
            })
        else:
            user_content.append({
                "type": "text",
                "text": "The user hasn't described the problem yet. Analyze the image for any visible damage.",
            })

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=1000,
                temperature=0.3,
            )

            raw_text = response.choices[0].message.content
            return self._parse_response(raw_text)

        except Exception as e:
            return {
                "device": "unknown",
                "damage_detected": False,
                "damage_description": f"Analysis failed: {str(e)}",
                "severity": "unknown",
                "confidence": 0.0,
                "tools": [],
                "steps": ["Check your API key and try again."],
                "warning": "None",
                "estimated_difficulty": "unknown",
                "estimated_cost": "unknown",
                "raw": str(e),
            }

    def _parse_response(self, text: str) -> dict:
        """Parse the JSON response from GPT-4o."""
        # Strip markdown code fences if present
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            result = json.loads(cleaned)
            result["raw"] = text
            return result
        except json.JSONDecodeError:
            return {
                "device": "unknown",
                "damage_detected": False,
                "damage_description": "Could not parse response",
                "severity": "unknown",
                "confidence": 0.0,
                "tools": [],
                "steps": [],
                "warning": "None",
                "estimated_difficulty": "unknown",
                "estimated_cost": "unknown",
                "raw": text,
            }
