import { useState, useRef, useCallback, useEffect } from "react";

export default function useMicrophone() {
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | error
  const [isMuted, setIsMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  /** Request mic permission and get audio stream. */
  const startMic = useCallback(async () => {
    setStatus("requesting");
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = audioStream;
      setStatus("active");
    } catch (err) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  }, []);

  /** Start recording audio via MediaRecorder (call on button press). */
  const startListening = useCallback(async () => {
    // Re-acquire stream if tracks are ended (common on mobile after stop)
    const tracks = streamRef.current?.getAudioTracks() || [];
    const alive = tracks.some((t) => t.readyState === "live");
    if (!streamRef.current || !alive) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = audioStream;
      } catch {
        return;
      }
    }

    chunksRef.current = [];
    setLiveTranscript("Listening...");
    setListening(true);

    // Pick a supported MIME type
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
  }, []);

  /** Stop recording and return the audio Blob. Returns Promise<Blob|null>. */
  const stopListening = useCallback(() => {
    setListening(false);
    setLiveTranscript("");

    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        resolve(blob);
      };
      recorder.stop();
      recorderRef.current = null;
    });
  }, []);

  const stopMic = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("idle");
    setIsMuted(false);
    setListening(false);
    setLiveTranscript("");
    chunksRef.current = [];
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

  const clearTranscript = useCallback(() => {
    setLiveTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    status,
    isMuted,
    listening,
    liveTranscript,
    startMic,
    stopMic,
    startListening,
    stopListening,
    toggleMute,
    clearTranscript,
  };
}
