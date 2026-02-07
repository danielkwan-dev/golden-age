import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CameraFeed from "./components/CameraFeed";
import PermissionGate from "./components/PermissionGate";
import StartScreen from "./components/StartScreen";
import ActiveSession from "./components/ActiveSession";
import AROverlayLayer from "./components/AROverlayLayer";
import SessionComplete from "./components/SessionComplete";
import useCamera from "./hooks/useCamera";
import useMicrophone from "./hooks/useMicrophone";
import useRepairSession from "./hooks/useRepairSession";
import { captureFrame, fetchPreview } from "./api/midas";

function App() {
  const camera = useCamera();
  const mic = useMicrophone();
  const session = useRepairSession();
  const [cameraToast, setCameraToast] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detections, setDetections] = useState([]);
  const previewUrlRef = useRef(null);

  // Advance to 'ready' phase once camera is active
  useEffect(() => {
    if (camera.status === "active" && session.phase === "permissions") {
      session.grantPermissions();
    }
  }, [camera.status, session.phase, session.grantPermissions]);

  // Request mic when session starts
  useEffect(() => {
    if (session.phase === "active" && mic.status === "idle") {
      mic.startMic();
    }
  }, [session.phase, mic.status, mic.startMic]);

  // Stop mic when session ends
  useEffect(() => {
    if (session.phase === "complete") {
      mic.stopMic();
    }
  }, [session.phase, mic.stopMic]);

  // Camera disconnect toast
  useEffect(() => {
    if (camera.status === "error" && session.phase === "active") {
      setCameraToast(true);
      const t = setTimeout(() => setCameraToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [camera.status, session.phase]);

  // OpenCV preview + detection loop: every 2s during active session
  useEffect(() => {
    if (session.phase !== "active" || camera.status !== "active") {
      setPreviewUrl(null);
      setDetections([]);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      return;
    }

    const interval = setInterval(async () => {
      const videoEl = camera.videoRef.current;
      if (!videoEl || videoEl.readyState < 2) return;
      try {
        const blob = await captureFrame(videoEl);
        const { imageUrl, detections: newDetections } = await fetchPreview(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = imageUrl;
        setPreviewUrl(imageUrl);
        setDetections(newDetections);
      } catch {
        // Preview server not running — ignore silently
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setDetections([]);
    };
  }, [session.phase, camera.status]);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-black">
      {/* Layer 1: Camera feed (z-0) */}
      <CameraFeed videoRef={camera.videoRef} isFrontFacing={camera.isFrontFacing} />

      {/* Layer 2: AR overlay (z-10) — live detections from OpenCV */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AROverlayLayer annotations={detections} />
      </div>

      {/* Layer 2.5: OpenCV enhanced preview thumbnail (z-15) */}
      {previewUrl && session.phase === "active" && (
        <div className="absolute top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] right-3 z-[15] pointer-events-none">
          <div className="glass border border-gold/20 rounded-lg overflow-hidden">
            <p className="text-[8px] text-gold/60 text-center py-0.5 bg-black/40">
              OpenCV Enhanced
            </p>
            <img
              src={previewUrl}
              alt="Enhanced preview"
              className="w-24 h-auto object-cover"
            />
          </div>
        </div>
      )}

      {/* Layer 3: UI overlays (z-20) */}
      <div className="absolute inset-0 z-20">
        <AnimatePresence mode="wait">
          {session.phase === "permissions" && (
            <PermissionGate
              key="permissions"
              cameraStatus={camera.status}
              onRequestCamera={camera.startCamera}
            />
          )}
          {session.phase === "ready" && (
            <StartScreen key="ready" onStart={session.startSession} />
          )}
          {session.phase === "active" && (
            <ActiveSession
              key="active"
              session={session}
              mic={mic}
              videoRef={camera.videoRef}
              torchSupported={camera.torchSupported}
              torchOn={camera.torchOn}
              onToggleTorch={camera.toggleTorch}
            />
          )}
          {session.phase === "complete" && (
            <SessionComplete key="complete" session={session} onRestart={session.resetSession} />
          )}
        </AnimatePresence>
      </div>

      {/* Camera disconnect toast */}
      <AnimatePresence>
        {cameraToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 glass border border-danger/30 rounded-full px-5 py-2.5"
          >
            <p className="text-danger text-xs font-medium">Camera disconnected</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
