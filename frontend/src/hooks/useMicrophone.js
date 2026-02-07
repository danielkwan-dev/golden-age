import { useState, useRef, useCallback, useEffect } from "react";

export default function useMicrophone() {
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | error
  const [isMuted, setIsMuted] = useState(false);
  const streamRef = useRef(null);

  const startMic = useCallback(async () => {
    setStatus("requesting");
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = audioStream;
      setStatus("active");
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  }, []);

  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("idle");
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { status, isMuted, startMic, stopMic, toggleMute };
}
