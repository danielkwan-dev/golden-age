import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import CameraFeed from "./components/CameraFeed";
import PermissionGate from "./components/PermissionGate";
import StartScreen from "./components/StartScreen";
import ActiveSession from "./components/ActiveSession";
import AROverlayLayer from "./components/AROverlayLayer";
import SessionComplete from "./components/SessionComplete";
import useCamera from "./hooks/useCamera";
import useMicrophone from "./hooks/useMicrophone";
import useRepairSession from "./hooks/useRepairSession";
import useAROverlays from "./hooks/useAROverlays";

function App() {
  const camera = useCamera();
  const mic = useMicrophone();
  const session = useRepairSession();
  const ar = useAROverlays();

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

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-black">
      {/* Layer 1: Camera feed (z-0) */}
      <CameraFeed videoRef={camera.videoRef} isFrontFacing={camera.isFrontFacing} />

      {/* Layer 2: AR overlay (z-10) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AROverlayLayer annotations={ar.activeAnnotations} />
      </div>

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
    </div>
  );
}

export default App;
