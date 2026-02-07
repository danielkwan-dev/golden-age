import { useState, useRef, useCallback, useEffect } from "react";

export default function useMicrophone() {
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | error
  const [isMuted, setIsMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef("");

  /** Request mic permission and get audio stream (no speech recognition yet). */
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

  /** Start speech recognition (call on button press). */
  const startListening = useCallback(() => {
    if (!streamRef.current) return;

    // Reset transcript for this new utterance
    fullTranscriptRef.current = "";
    setLiveTranscript("");
    setListening(true);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim = t;
        }
      }
      if (final) {
        fullTranscriptRef.current += final;
      }
      setLiveTranscript(fullTranscriptRef.current + interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("Speech recognition error:", e.error);
      }
    };

    // Auto-restart if browser stops mid-utterance (silence timeout)
    recognition.onend = () => {
      if (listening && streamRef.current) {
        try {
          recognition.start();
        } catch {
          // already stopped
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [listening]);

  /** Stop speech recognition (call on button release). Returns the transcript. */
  const stopListening = useCallback(() => {
    setListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const result = fullTranscriptRef.current.trim() || liveTranscript.trim();
    return result;
  }, [liveTranscript]);

  const stopMic = useCallback(() => {
    // Stop speech recognition if running
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("idle");
    setIsMuted(false);
    setListening(false);
    setLiveTranscript("");
    fullTranscriptRef.current = "";
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
    fullTranscriptRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
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
