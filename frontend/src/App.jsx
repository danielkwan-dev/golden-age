import { useEffect } from "react";
import CameraFeed from "./components/CameraFeed";
import PermissionGate from "./components/PermissionGate";
import StartScreen from "./components/StartScreen";
import ActiveSession from "./components/ActiveSession";
import AROverlayLayer from "./components/AROverlayLayer";
import SessionComplete from "./components/SessionComplete";
import useCamera from "./hooks/useCamera";
import useRepairSession from "./hooks/useRepairSession";
import useAROverlays from "./hooks/useAROverlays";

function App() {
  const camera = useCamera();
  const session = useRepairSession();
  const ar = useAROverlays();

  // Advance to 'ready' phase once camera is active
  useEffect(() => {
    if (camera.status === "active" && session.phase === "permissions") {
      session.grantPermissions();
    }
  }, [camera.status, session.phase, session.grantPermissions]);

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
        {session.phase === "permissions" && (
          <PermissionGate
            cameraStatus={camera.status}
            onRequestCamera={camera.startCamera}
          />
        )}
        {session.phase === "ready" && (
          <StartScreen onStart={session.startSession} />
        )}
        {session.phase === "active" && (
          <ActiveSession session={session} />
        )}
        {session.phase === "complete" && (
          <SessionComplete session={session} onRestart={session.resetSession} />
        )}
      </div>
    </div>
  );
}

export default App;
