// If VITE_API_URL is set (e.g. to http://localhost:8000), use it.
// Otherwise, use empty string to make requests relative to the current origin (Single Server Mode).
const API_BASE = import.meta.env.VITE_API_URL || "";

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
 * Send a frame to the OpenCV preview + detection endpoint (free, no GPT-4o).
 * Returns { imageUrl, detections } where detections is an array of AR markers.
 */
export async function fetchPreview(imageBlob, flip = false) {
  const form = new FormData();
  form.append("image", imageBlob, "frame.jpg");
  form.append("flip", flip);
  const res = await fetch(`${API_BASE}/preview`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Preview failed");
  const data = await res.json();
  // Convert base64 image to object URL
  const binary = atob(data.image);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const imgBlob = new Blob([bytes], { type: "image/jpeg" });
  return {
    imageUrl: URL.createObjectURL(imgBlob),
    detections: data.detections || [],
  };
}

/**
 * Send a frame + transcript to GPT-4o Vision for full analysis.
 * Returns the diagnosis JSON.
 */
export async function analyzeFrame(imageBlob, transcript = "", flip = false) {
  const form = new FormData();
  form.append("image", imageBlob, "frame.jpg");
  form.append("transcript", transcript);
  form.append("flip", flip);
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
export async function chatWithMidas(messages, imageBlob = null, flip = false) {
  const form = new FormData();
  form.append("messages", JSON.stringify(messages));
  form.append("flip", flip);
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
