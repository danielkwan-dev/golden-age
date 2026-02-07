"""
Speech context engine — parses Whisper transcripts and produces confidence
boosts for fault classes that match what the user is describing.

When the user says "the screen is cracked", detections for lcd_retak and
lcd_rusak get a confidence boost, while unrelated classes get suppressed.
"""

import re
from typing import Dict, List, Tuple

# Maps keywords/phrases (lowercased) to fault class names and a relevance weight.
# Higher weight = stronger signal that the user is talking about this fault.
KEYWORD_MAP: Dict[str, List[Tuple[str, float]]] = {
    # Screen / LCD damage keywords
    "screen":          [("lcd_retak", 0.8), ("lcd_rusak", 0.8), ("lcd_garis", 0.6), ("phone_damage", 0.3)],
    "display":         [("lcd_retak", 0.8), ("lcd_rusak", 0.8), ("lcd_garis", 0.6)],
    "lcd":             [("lcd_retak", 0.9), ("lcd_rusak", 0.9), ("lcd_garis", 0.7)],
    "cracked screen":  [("lcd_retak", 1.0), ("phone_damage", 0.4)],
    "broken screen":   [("lcd_rusak", 1.0), ("lcd_retak", 0.7), ("phone_damage", 0.4)],
    "dead screen":     [("lcd_rusak", 1.0)],
    "black screen":    [("lcd_rusak", 1.0)],
    "lines on screen": [("lcd_garis", 1.0)],
    "lines":           [("lcd_garis", 0.9)],
    "streaks":         [("lcd_garis", 0.9)],
    "flickering":      [("lcd_garis", 0.7), ("lcd_rusak", 0.5)],
    "glitching":       [("lcd_garis", 0.7), ("lcd_rusak", 0.5)],

    # Body damage keywords
    "scratch":         [("body_lecet", 1.0)],
    "scratched":       [("body_lecet", 1.0)],
    "scuff":           [("body_lecet", 0.9)],
    "scraped":         [("body_lecet", 0.9)],
    "crack":           [("body_retak", 0.8), ("lcd_retak", 0.6)],
    "cracked":         [("body_retak", 0.8), ("lcd_retak", 0.6)],
    "cracked back":    [("body_retak", 1.0)],
    "back panel":      [("body_retak", 0.9), ("body_lecet", 0.5)],
    "back glass":      [("body_retak", 1.0)],
    "body crack":      [("body_retak", 1.0)],
    "body damage":     [("body_retak", 0.8), ("body_lecet", 0.6), ("phone_damage", 0.4)],
    "dent":            [("body_retak", 0.7), ("phone_damage", 0.5)],
    "bent":            [("body_retak", 0.7), ("phone_damage", 0.5)],

    # General damage keywords
    "broken":          [("phone_damage", 0.8), ("lcd_rusak", 0.5), ("body_retak", 0.5)],
    "damaged":         [("phone_damage", 0.9)],
    "smashed":         [("lcd_rusak", 0.9), ("body_retak", 0.7), ("phone_damage", 0.6)],
    "shattered":       [("lcd_rusak", 1.0), ("body_retak", 0.7)],
    "dropped":         [("phone_damage", 0.7), ("lcd_retak", 0.5), ("body_retak", 0.5)],
    "fell":            [("phone_damage", 0.6), ("lcd_retak", 0.4), ("body_retak", 0.4)],
    "water damage":    [("phone_damage", 0.9)],
    "not working":     [("phone_damage", 0.8), ("lcd_rusak", 0.6)],
    "won't turn on":   [("lcd_rusak", 0.8), ("phone_damage", 0.7)],

    # Device keywords (neutral — just confirms we're looking at a phone)
    "phone":           [("phone", 0.3), ("smartphone", 0.3)],
    "iphone":          [("phone", 0.3), ("smartphone", 0.3)],
    "samsung":         [("phone", 0.3), ("smartphone", 0.3)],
    "android":         [("phone", 0.3), ("smartphone", 0.3)],
    "device":          [("phone", 0.2), ("smartphone", 0.2)],
}

# Longer phrases should be matched first to avoid partial matches
_SORTED_KEYWORDS = sorted(KEYWORD_MAP.keys(), key=len, reverse=True)


class SpeechContext:
    """
    Maintains a rolling context from user speech and produces per-class
    confidence adjustments for the detection pipeline.
    """

    def __init__(self, boost_factor: float = 0.15, decay: float = 0.85):
        """
        Args:
            boost_factor: How much to boost confidence (0-1 scale, added to conf).
            decay: Each frame, previous boosts are multiplied by this (0-1).
                   Keeps context alive for a few seconds after the user stops talking.
        """
        self.boost_factor = boost_factor
        self.decay = decay
        self._class_scores: Dict[str, float] = {}

    def update(self, transcript: str):
        """Parse a new transcript chunk and update internal class scores."""
        if not transcript:
            return

        text = transcript.lower().strip()
        matched_classes: Dict[str, float] = {}

        # Match longer phrases first, then single keywords
        for keyword in _SORTED_KEYWORDS:
            if keyword in text:
                for class_name, weight in KEYWORD_MAP[keyword]:
                    current = matched_classes.get(class_name, 0.0)
                    matched_classes[class_name] = min(1.0, current + weight)

        # Merge into rolling scores
        for cls, score in matched_classes.items():
            existing = self._class_scores.get(cls, 0.0)
            self._class_scores[cls] = min(1.0, max(existing, score))

    def tick(self):
        """Decay scores each frame so context fades over time."""
        for cls in list(self._class_scores.keys()):
            self._class_scores[cls] *= self.decay
            if self._class_scores[cls] < 0.01:
                del self._class_scores[cls]

    def adjust_detections(self, detections: list) -> list:
        """
        Adjust detection confidences based on speech context.

        Boosts detections that match what the user described.
        Slightly suppresses detections that contradict speech context
        (e.g., user says "screen crack" but model detects "body scratch").

        Args:
            detections: List of detection dicts with 'label' and 'confidence' keys.

        Returns:
            Updated detections list, re-sorted by adjusted confidence.
        """
        if not self._class_scores or not detections:
            return detections

        has_strong_context = any(v > 0.5 for v in self._class_scores.values())

        adjusted = []
        for det in detections:
            det = det.copy()
            label = det["label"]
            conf = det["confidence"]
            score = self._class_scores.get(label, 0.0)

            if score > 0:
                # Boost matching detections
                boost = self.boost_factor * score
                det["confidence"] = min(0.99, conf + boost)
                det["speech_match"] = True
            elif has_strong_context:
                # Slightly suppress non-matching detections when user gave clear context
                det["confidence"] = conf * 0.9
                det["speech_match"] = False
            else:
                det["speech_match"] = False

            adjusted.append(det)

        # Re-sort by confidence
        adjusted.sort(key=lambda d: d["confidence"], reverse=True)
        return adjusted

    def get_context_summary(self) -> str:
        """Return a human-readable summary of current speech context."""
        if not self._class_scores:
            return ""
        top = sorted(self._class_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        parts = [f"{cls.replace('_', ' ')} ({score:.0%})" for cls, score in top]
        return "Context: " + ", ".join(parts)
