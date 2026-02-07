"""
MIDAS Real-Time Inference Pipeline.

Captures video frames, runs YOLOv11 detection, transcribes speech with Whisper,
and draws an AR-style overlay with OpenCV showing what's broken and how to fix it.

Usage:
    python inference.py                              # webcam
    python inference.py --source video.mp4           # video file
    python inference.py --source 0                   # camera index
    python inference.py --model runs/train/weights/best.pt
"""

import os
import sys
import time
import argparse
import threading
import queue

import cv2
import numpy as np
from ultralytics import YOLO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from configs.config import load_config
from utils.overlay import draw_detection_overlay, draw_repair_panel
from utils.repair_kb import get_repair_info
from utils.transcriber import AudioTranscriber
from utils.speech_context import SpeechContext


class MidasInference:
    def __init__(self, model_path: str, config_path: str = None, use_audio: bool = True):
        self.cfg = load_config(config_path)
        self.model = YOLO(model_path)
        self.fault_classes = self.cfg.fault_classes
        self.frame_count = 0

        # Audio transcription (runs in background thread)
        self.use_audio = use_audio
        self.transcript_queue = queue.Queue()
        self.latest_transcript = ""
        self.speech_context = SpeechContext(boost_factor=0.15, decay=0.85)
        if use_audio:
            self.transcriber = AudioTranscriber(
                model_size=self.cfg.audio.whisper_model,
                sample_rate=self.cfg.audio.sample_rate,
                chunk_duration=self.cfg.audio.chunk_duration_sec,
                output_queue=self.transcript_queue,
            )

    def process_frame(self, frame: np.ndarray) -> tuple:
        """Run detection on a single frame. Returns (annotated_frame, detections)."""
        self.frame_count += 1

        # Only run detection on every Nth frame for performance
        if self.frame_count % self.cfg.inference.frame_sample_interval != 0:
            return frame, []

        results = self.model.predict(
            source=frame,
            conf=self.cfg.inference.confidence_threshold,
            iou=self.cfg.inference.iou_threshold,
            max_det=self.cfg.inference.max_detections,
            device=self.cfg.inference.device,
            verbose=False,
        )

        detections = []
        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()

                    fault_label = self.fault_classes[cls_id] if cls_id < len(self.fault_classes) else "unknown"
                    detections.append({
                        "class_id": cls_id,
                        "label": fault_label,
                        "confidence": conf,
                        "bbox": (int(x1), int(y1), int(x2), int(y2)),
                        "repair_info": get_repair_info(fault_label),
                    })

        return frame, detections

    def run_video(self, source=0):
        """Main inference loop — captures video, detects faults, draws overlay."""
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            print(f"Error: cannot open video source '{source}'")
            return

        print(f"Starting MIDAS inference on source: {source}")
        print("Press 'q' to quit, 's' to save a screenshot")

        # Start audio transcription in background
        if self.use_audio:
            self.transcriber.start()

        last_detections = []
        fps_time = time.time()

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Check for new transcript and update speech context
                if self.use_audio:
                    while not self.transcript_queue.empty():
                        self.latest_transcript = self.transcript_queue.get_nowait()
                        self.speech_context.update(self.latest_transcript)

                # Run detection
                annotated, detections = self.process_frame(frame)
                if detections:
                    # Apply speech context to boost/suppress detections
                    detections = self.speech_context.adjust_detections(detections)
                    last_detections = detections

                # Decay speech context each frame
                self.speech_context.tick()

                # Draw AR overlay
                overlay = draw_detection_overlay(
                    annotated, last_detections,
                    alpha=self.cfg.inference.overlay_alpha,
                    show_labels=self.cfg.inference.show_labels,
                    show_conf=self.cfg.inference.show_confidence,
                )

                # Draw repair step panel on the side
                if last_detections:
                    overlay = draw_repair_panel(overlay, last_detections[0])

                # Draw transcript bar at bottom
                if self.latest_transcript:
                    overlay = self._draw_transcript_bar(overlay, self.latest_transcript)

                # Draw speech context indicator
                context_summary = self.speech_context.get_context_summary()
                if context_summary:
                    overlay = self._draw_context_bar(overlay, context_summary)

                # FPS counter
                now = time.time()
                fps = 1.0 / max(now - fps_time, 1e-6)
                fps_time = now
                cv2.putText(overlay, f"FPS: {fps:.1f}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                cv2.imshow("MIDAS - AR Repair Assistant", overlay)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
                elif key == ord("s"):
                    filename = f"midas_screenshot_{int(time.time())}.jpg"
                    cv2.imwrite(filename, overlay)
                    print(f"Screenshot saved: {filename}")

        finally:
            cap.release()
            cv2.destroyAllWindows()
            if self.use_audio:
                self.transcriber.stop()

    @staticmethod
    def _draw_context_bar(frame: np.ndarray, text: str) -> np.ndarray:
        """Draw a speech context indicator bar above the transcript bar."""
        h, w = frame.shape[:2]
        bar_y = h - 80
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, bar_y), (w, bar_y + 25), (40, 40, 40), -1)
        frame = cv2.addWeighted(overlay, 0.6, frame, 0.4, 0)
        cv2.putText(frame, text, (10, bar_y + 17),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 255, 200), 1)
        return frame

    @staticmethod
    def _draw_transcript_bar(frame: np.ndarray, text: str) -> np.ndarray:
        """Draw a semi-transparent bar at the bottom with transcribed speech."""
        h, w = frame.shape[:2]
        bar_height = 50
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, h - bar_height), (w, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.6, frame, 0.4, 0)

        # Truncate text to fit
        max_chars = w // 12
        display_text = text[-max_chars:] if len(text) > max_chars else text
        cv2.putText(frame, f"User: {display_text}", (10, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        return frame


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MIDAS Real-Time Inference")
    parser.add_argument("--model", type=str, default=None,
                        help="Path to trained YOLO .pt or .onnx model")
    parser.add_argument("--source", type=str, default="0",
                        help="Video source: camera index, video file path, or RTSP URL")
    parser.add_argument("--config", type=str, default=None, help="Path to config YAML")
    parser.add_argument("--no-audio", action="store_true", help="Disable audio transcription")
    args = parser.parse_args()

    # Default model path
    if args.model is None:
        ml_root = os.path.dirname(os.path.abspath(__file__))
        args.model = os.path.join(ml_root, "runs", "train", "weights", "best.pt")

    # Parse source — if it's a digit, treat as camera index
    source = int(args.source) if args.source.isdigit() else args.source

    engine = MidasInference(
        model_path=args.model,
        config_path=args.config,
        use_audio=not args.no_audio,
    )
    engine.run_video(source=source)
