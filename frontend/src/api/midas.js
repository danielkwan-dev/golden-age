const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Capture a JPEG frame from a <video> element.
 */
export async function captureFrame(videoEl) {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext("2d").drawImage(videoEl, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
}

/**
 * Send a frame to the OpenCV-only preview endpoint (free, no GPT-4o).
 * Returns an object URL for the enhanced JPEG.
 */
export async function fetchPreview(imageBlob) {
  const form = new FormData();
  form.append("image", imageBlob, "frame.jpg");
  const res = await fetch(`${API_BASE}/preview`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Preview failed");
  return URL.createObjectURL(await res.blob());
}

/**
 * Send a frame + transcript to GPT-4o Vision for full analysis.
 * Returns the diagnosis JSON.
 */
export async function analyzeFrame(imageBlob, transcript = "") {
  const form = new FormData();
  form.append("image", imageBlob, "frame.jpg");
  form.append("transcript", transcript);
  const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

/**
 * Multi-turn conversation with MIDAS.
 *
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {Blob|null} imageBlob - Optional camera frame to include
 * @returns {Promise<string>} The AI's reply text
 */
export async function chatWithMidas(messages, imageBlob = null) {
  const form = new FormData();
  form.append("messages", JSON.stringify(messages));
  if (imageBlob) {
    form.append("image", imageBlob, "frame.jpg");
  }
  const res = await fetch(`${API_BASE}/chat`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Chat failed");
  const data = await res.json();
  return data.reply;
}

/**
 * Send an audio blob to the backend for Whisper transcription.
 * @param {Blob} audioBlob - WebM/Opus audio from MediaRecorder
 * @returns {Promise<string>} The transcribed text
 */
export async function transcribeAudio(audioBlob) {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  const res = await fetch(`${API_BASE}/transcribe`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Transcription failed");
  const data = await res.json();
  return data.text || "";
}

/**
 * Request TTS audio from the backend.
 * @param {string} text - Text to speak
 * @returns {Promise<ArrayBuffer>} MP3 audio bytes
 */
export async function speakText(text) {
  const res = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: "nova" }),
  });
  if (!res.ok) throw new Error("TTS failed");
  return res.arrayBuffer();
}
