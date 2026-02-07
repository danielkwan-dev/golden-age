import { useState, useRef, useCallback, useEffect } from "react";

export default function useCamera() {
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | error
  const [error, setError] = useState(null);
  const [isFrontFacing, setIsFrontFacing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const attachStream = useCallback((mediaStream) => {
    streamRef.current = mediaStream;
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }

    // Detect if front-facing camera
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      setIsFrontFacing(settings.facingMode === "user");
    }

    setStatus("active");
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("requesting");
    setError(null);

    try {
      // Try rear camera first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      attachStream(mediaStream);
    } catch (err) {
      // If rear camera fails, fall back to any camera (desktop)
      if (err.name === "OverconstrainedError" || err.name === "NotFoundError") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false,
          });
          attachStream(fallbackStream);
          return;
        } catch (fallbackErr) {
          err = fallbackErr;
        }
      }

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("denied");
      } else {
        setStatus("error");
      }
      setError(err);
    }
  }, [attachStream]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    status,
    error,
    isFrontFacing,
    videoRef,
    startCamera,
    stopCamera,
  };
}
