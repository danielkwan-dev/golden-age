"""
OpenCV overlay drawing utilities for MIDAS AR repair assistant.

Draws bounding boxes, fault labels, severity indicators, and repair step panels
onto video frames to create the AR overlay effect.
"""

import cv2
import numpy as np


# Color palette for severity levels
SEVERITY_COLORS = {
    "easy": (0, 200, 0),       # green
    "moderate": (0, 180, 255),  # orange
    "high": (0, 0, 255),       # red
    "unknown": (180, 180, 180), # gray
}

# Color palette for bounding boxes (cycles through these)
BOX_COLORS = [
    (255, 100, 100),   # light blue
    (100, 255, 100),   # light green
    (100, 100, 255),   # light red
    (255, 255, 100),   # cyan
    (255, 100, 255),   # magenta
    (100, 255, 255),   # yellow
]


def draw_detection_overlay(
    frame: np.ndarray,
    detections: list,
    alpha: float = 0.4,
    show_labels: bool = True,
    show_conf: bool = True,
) -> np.ndarray:
    """
    Draw bounding boxes and labels on the frame for each detection.

    Each detection dict should have:
        - bbox: (x1, y1, x2, y2)
        - label: str
        - confidence: float
        - repair_info: dict with "severity" key
    """
    if not detections:
        return frame

    overlay = frame.copy()

    for i, det in enumerate(detections):
        x1, y1, x2, y2 = det["bbox"]
        label = det["label"]
        conf = det["confidence"]
        severity = det.get("repair_info", {}).get("severity", "unknown")

        color = BOX_COLORS[i % len(BOX_COLORS)]
        sev_color = SEVERITY_COLORS.get(severity, SEVERITY_COLORS["unknown"])

        # Draw filled rectangle with transparency
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)

        # Draw solid border
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)

        # Draw corner accents (AR style)
        corner_len = min(30, (x2 - x1) // 4, (y2 - y1) // 4)
        thick = 3
        # Top-left
        cv2.line(frame, (x1, y1), (x1 + corner_len, y1), (255, 255, 255), thick)
        cv2.line(frame, (x1, y1), (x1, y1 + corner_len), (255, 255, 255), thick)
        # Top-right
        cv2.line(frame, (x2, y1), (x2 - corner_len, y1), (255, 255, 255), thick)
        cv2.line(frame, (x2, y1), (x2, y1 + corner_len), (255, 255, 255), thick)
        # Bottom-left
        cv2.line(frame, (x1, y2), (x1 + corner_len, y2), (255, 255, 255), thick)
        cv2.line(frame, (x1, y2), (x1, y2 - corner_len), (255, 255, 255), thick)
        # Bottom-right
        cv2.line(frame, (x2, y2), (x2 - corner_len, y2), (255, 255, 255), thick)
        cv2.line(frame, (x2, y2), (x2, y2 - corner_len), (255, 255, 255), thick)

        # Build label text
        if show_labels:
            parts = [label.replace("_", " ").title()]
            if show_conf:
                parts.append(f"{conf:.0%}")
            text = " | ".join(parts)

            # Label background
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(frame, (x1, y1 - th - 12), (x1 + tw + 10, y1), color, -1)
            cv2.putText(frame, text, (x1 + 5, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # Severity badge
            sev_text = severity.upper()
            (sw, sh), _ = cv2.getTextSize(sev_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(frame, (x2 - sw - 10, y1 - sh - 12), (x2, y1), sev_color, -1)
            cv2.putText(frame, sev_text, (x2 - sw - 5, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    # Blend the filled rectangles with the original frame
    frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
    return frame


def draw_repair_panel(
    frame: np.ndarray,
    detection: dict,
    panel_width: int = 320,
) -> np.ndarray:
    """
    Draw a repair info panel on the right side of the frame showing
    the fault name, severity, tools needed, and step-by-step instructions.
    """
    h, w = frame.shape[:2]
    repair = detection.get("repair_info", {})
    severity = repair.get("severity", "unknown")
    tools = repair.get("tools", [])
    steps = repair.get("steps", [])
    label = detection["label"].replace("_", " ").title()

    # Extend frame to the right for the panel
    panel = np.zeros((h, panel_width, 3), dtype=np.uint8)
    panel[:] = (30, 30, 30)  # dark background

    y = 30
    sev_color = SEVERITY_COLORS.get(severity, SEVERITY_COLORS["unknown"])

    # Title
    cv2.putText(panel, "REPAIR GUIDE", (10, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    y += 35

    # Fault name
    cv2.putText(panel, label, (10, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 255), 2)
    y += 30

    # Severity
    cv2.putText(panel, f"Severity: {severity.upper()}", (10, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, sev_color, 2)
    y += 30

    # Divider
    cv2.line(panel, (10, y), (panel_width - 10, y), (80, 80, 80), 1)
    y += 20

    # Tools
    cv2.putText(panel, "Tools needed:", (10, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
    y += 22
    for tool in tools[:5]:
        cv2.putText(panel, f"  - {tool}", (10, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (150, 150, 150), 1)
        y += 18

    y += 10
    cv2.line(panel, (10, y), (panel_width - 10, y), (80, 80, 80), 1)
    y += 20

    # Steps
    cv2.putText(panel, "Steps:", (10, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
    y += 22

    for i, step in enumerate(steps):
        if y > h - 20:
            cv2.putText(panel, "  ... (scroll for more)", (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (120, 120, 120), 1)
            break

        # Wrap long step text
        prefix = f"{i + 1}. "
        max_chars = (panel_width - 30) // 8
        words = step.split()
        lines = []
        current = prefix
        for word in words:
            if len(current) + len(word) + 1 > max_chars:
                lines.append(current)
                current = "   " + word
            else:
                current += (" " if current.strip() else "") + word
        if current.strip():
            lines.append(current)

        for line in lines:
            if y > h - 20:
                break
            cv2.putText(panel, line, (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, (200, 200, 200), 1)
            y += 16
        y += 6

    # Combine frame and panel
    combined = np.hstack([frame, panel])
    return combined
