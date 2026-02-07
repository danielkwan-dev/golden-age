import { useState, useRef, useCallback, useEffect } from "react";

export default function useMicrophone() {
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | error
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef("");

  const startMic = useCallback(async () => {
    setStatus("requesting");
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = audioStream;
      setStatus("active");

      // Start Web Speech API for live transcription
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
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

        // Auto-restart when browser stops after silence
        recognition.onend = () => {
          if (streamRef.current) {
            try {
              recognition.start();
            } catch {
              // already running
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
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

  const stopMic = useCallback(() => {
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
      // Pause/resume speech recognition
      if (recognitionRef.current) {
        if (next) {
          recognitionRef.current.stop();
        } else {
          try {
            recognitionRef.current.start();
          } catch {
            // already running
          }
        }
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
    liveTranscript,
    startMic,
    stopMic,
    toggleMute,
    clearTranscript,
  };
}
