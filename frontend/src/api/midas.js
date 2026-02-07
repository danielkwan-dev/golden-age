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
