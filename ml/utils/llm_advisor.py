"""
LLM-powered repair advisor using OpenAI GPT.

Takes YOLO detection results + user speech transcript and generates
context-aware, dynamic repair instructions instead of static lookup tables.
"""

import os
from typing import List, Optional

from openai import OpenAI

SYSTEM_PROMPT = """You are MIDAS, an AR-powered repair assistant. You help users diagnose and fix broken technology.

You receive:
1. Detection results from a computer vision model (what damage was found, where, confidence level)
2. The user's spoken description of the problem (transcribed from speech)

Your job:
- Provide clear, step-by-step repair instructions based on the detected damage
- Tailor instructions to the specific damage type and severity
- If the user mentioned additional context (e.g. "I dropped it in water"), factor that into your diagnosis
- Keep steps concise and actionable — the user is reading these on a phone screen while repairing
- List required tools at the top
- Warn about safety hazards (e.g. battery swelling, sharp glass)
- If multiple issues are detected, prioritize by severity

Format your response as:
DIAGNOSIS: [1-2 sentence summary of what's wrong]
SEVERITY: [low/moderate/high]
TOOLS: [comma-separated list]
STEPS:
1. [step]
2. [step]
...
WARNING: [any safety warnings, or "None"]
"""


class LLMAdvisor:
    def __init__(self, model: str = "gpt-4o-mini", api_key: str = None):
        """
        Args:
            model: OpenAI model to use. gpt-4o-mini is fast and cheap,
                   gpt-4o for higher quality.
            api_key: OpenAI API key. Falls back to OPENAI_API_KEY env var.
        """
        self.model = model
        self.client = OpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"))

    def get_repair_instructions(
        self,
        detections: List[dict],
        transcript: str = "",
        device_description: str = "",
    ) -> dict:
        """
        Generate repair instructions from detections and user context.

        Args:
            detections: List of detection dicts from YOLO with keys:
                        label, confidence, bbox, repair_info
            transcript: Latest speech transcript from the user.
            device_description: Optional device info (e.g. "iPhone 13").

        Returns:
            dict with keys: diagnosis, severity, tools, steps, warning, raw
        """
        # Build the detection summary for the prompt
        detection_summary = self._format_detections(detections)

        user_message = f"""Detection Results:
{detection_summary}

User's Description: {transcript if transcript else "No verbal description provided."}

Device: {device_description if device_description else "Unknown smartphone"}

Please provide repair instructions."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=800,
                temperature=0.3,
            )

            raw_text = response.choices[0].message.content
            return self._parse_response(raw_text)

        except Exception as e:
            return {
                "diagnosis": f"LLM unavailable: {str(e)}",
                "severity": "unknown",
                "tools": [],
                "steps": ["Unable to generate instructions. Check API key and connection."],
                "warning": "None",
                "raw": str(e),
            }

    def _format_detections(self, detections: List[dict]) -> str:
        """Format detections into readable text for the LLM prompt."""
        if not detections:
            return "No damage detected by the vision model."

        lines = []
        for i, det in enumerate(detections, 1):
            label = det.get("label", "unknown").replace("_", " ")
            conf = det.get("confidence", 0)
            bbox = det.get("bbox", {})
            speech_match = det.get("speech_match", False)

            line = f"{i}. {label} (confidence: {conf:.0%})"
            if speech_match:
                line += " [matches user description]"
            if isinstance(bbox, tuple) and len(bbox) == 4:
                line += f" at region ({bbox[0]},{bbox[1]})-({bbox[2]},{bbox[3]})"
            lines.append(line)

        return "\n".join(lines)

    def _parse_response(self, text: str) -> dict:
        """Parse the structured LLM response into a dict."""
        result = {
            "diagnosis": "",
            "severity": "unknown",
            "tools": [],
            "steps": [],
            "warning": "None",
            "raw": text,
        }

        current_section = None
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            if line.startswith("DIAGNOSIS:"):
                result["diagnosis"] = line[len("DIAGNOSIS:"):].strip()
                current_section = "diagnosis"
            elif line.startswith("SEVERITY:"):
                result["severity"] = line[len("SEVERITY:"):].strip().lower()
                current_section = "severity"
            elif line.startswith("TOOLS:"):
                tools_text = line[len("TOOLS:"):].strip()
                result["tools"] = [t.strip() for t in tools_text.split(",") if t.strip()]
                current_section = "tools"
            elif line.startswith("STEPS:"):
                current_section = "steps"
            elif line.startswith("WARNING:"):
                result["warning"] = line[len("WARNING:"):].strip()
                current_section = "warning"
            elif current_section == "steps":
                # Strip numbering like "1. " or "- "
                step = line.lstrip("0123456789.-) ").strip()
                if step:
                    result["steps"].append(step)

        return result
