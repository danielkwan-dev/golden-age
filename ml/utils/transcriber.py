"""
Real-time audio transcription using OpenAI Whisper.

Runs in a background thread, captures audio from the microphone in chunks,
transcribes each chunk, and pushes the text to a queue for the main
inference loop to consume.
"""

import threading
import queue
import numpy as np

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False


class AudioTranscriber:
    def __init__(
        self,
        model_size: str = "base",
        sample_rate: int = 16000,
        chunk_duration: int = 5,
        output_queue: queue.Queue = None,
    ):
        self.model_size = model_size
        self.sample_rate = sample_rate
        self.chunk_duration = chunk_duration
        self.output_queue = output_queue or queue.Queue()

        self._running = False
        self._thread = None
        self._model = None

    def start(self):
        """Start the background transcription thread."""
        if not WHISPER_AVAILABLE:
            print("Warning: openai-whisper not installed. Audio transcription disabled.")
            return
        if not SOUNDDEVICE_AVAILABLE:
            print("Warning: sounddevice not installed. Audio transcription disabled.")
            return

        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        print(f"Audio transcriber started (Whisper {self.model_size})")

    def stop(self):
        """Stop the background transcription thread."""
        self._running = False
        if self._thread is not None:
            self._thread.join(timeout=3)
            self._thread = None

    def _run(self):
        """Background loop: record audio chunks and transcribe."""
        self._model = whisper.load_model(self.model_size)
        chunk_samples = self.sample_rate * self.chunk_duration

        while self._running:
            try:
                audio = sd.rec(
                    chunk_samples,
                    samplerate=self.sample_rate,
                    channels=1,
                    dtype="float32",
                )
                sd.wait()

                if not self._running:
                    break

                audio_np = audio.flatten()

                # Skip silent chunks
                if np.max(np.abs(audio_np)) < 0.01:
                    continue

                result = self._model.transcribe(
                    audio_np,
                    language="en",
                    fp16=False,
                )
                text = result.get("text", "").strip()
                if text:
                    self.output_queue.put(text)

            except Exception as e:
                print(f"Audio transcription error: {e}")
                continue
