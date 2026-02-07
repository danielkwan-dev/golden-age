import { useState, useCallback, useRef } from "react";
import {
  captureFrame,
  chatWithMidas,
  transcribeAudio,
  speakText,
} from "../api/midas";

export default function useRepairSession() {
  const [phase, setPhase] = useState("permissions"); // permissions | ready | active | complete
  const [transcript, setTranscript] = useState([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [activeAnnotations, setActiveAnnotations] = useState([]);
  // Each entry: { text: string, completed: boolean }
  const [repairSteps, setRepairSteps] = useState([]);

  const cancelRef = useRef(false);
  const timeoutRef = useRef(null);
  const audioRef = useRef(null);
  const videoElRef = useRef(null);

  const sleep = (ms) =>
    new Promise((resolve) => {
      timeoutRef.current = setTimeout(resolve, ms);
    });

  const streamWords = async (text) => {
    const words = text.split(" ");
    let accumulated = "";
    for (let i = 0; i < words.length; i++) {
      if (cancelRef.current) return;
      accumulated += (i === 0 ? "" : " ") + words[i];
      setStreamingText(accumulated);
      await sleep(40 + Math.random() * 25);
    }
  };

  /**
   * Extract a single step from AI text (e.g. "Step 3: Do this").
   * Appends it to the accumulated step list as the new current step.
   */
  const extractStep = (text) => {
    const lines = text.split("\n");
    for (const line of lines) {
      // Match: "Step N: ...", "N. ...", "N) ...", "N - ..."
      const match = line.match(/^\s*(?:step\s+)?\d+\s*[.):\-]\s*(.+)/i);
      if (match) {
        const clean = match[1].trim().replace(/\*{1,2}/g, "");
        setRepairSteps((prev) => [...prev, { text: clean, completed: false }]);
        return;
      }
    }
  };

  const buildMessages = (history, newUserText) => {
    const msgs = history.map((msg) => ({
      role: msg.speaker === "user" ? "user" : "assistant",
      content: msg.text,
    }));
    if (newUserText.trim()) {
      msgs.push({ role: "user", content: newUserText.trim() });
    }
    return msgs;
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  /**
   * Shared core: capture frame, send to chat, stream response, play TTS.
   * Called by scan(), scanPhoto(), and completeStep().
   */
  const sendToChat = async (videoEl, userText) => {
    setStreamingText("Scanning device...");
    const blob = await captureFrame(videoEl);
    const messages = buildMessages(transcript, userText);
    const aiText = await chatWithMidas(messages, blob);

    // Stream text + fetch TTS in parallel
    setStreamingText("");
    const [, audioBytes] = await Promise.all([
      streamWords(aiText),
      speakText(aiText).catch(() => null),
    ]);

    if (!cancelRef.current) {
      setTranscript((prev) => [
        ...prev,
        { speaker: "ai", text: aiText, timestamp: new Date() },
      ]);
      extractStep(aiText);
      setStreamingText("");

      if (audioBytes) {
        try {
          const mp3Blob = new Blob([audioBytes], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(mp3Blob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => {
            setAiSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
          };
          audio.play();
        } catch {
          setAiSpeaking(false);
        }
      } else {
        setAiSpeaking(false);
      }
    }
  };

  /**
   * Hold-to-talk flow: transcribe audio via Whisper, then send to chat.
   */
  const scan = useCallback(
    async (videoEl, audioBlob = null) => {
      if (scanning || !videoEl) return;

      videoElRef.current = videoEl;
      setScanning(true);
      setAiSpeaking(true);
      cancelRef.current = false;

      // Transcribe audio via Whisper
      let spokenText = "";
      if (audioBlob && audioBlob.size > 0) {
        try {
          setStreamingText("Transcribing...");
          spokenText = await transcribeAudio(audioBlob);
        } catch (err) {
          console.warn("Transcription failed:", err);
        }
      }

      if (spokenText.trim()) {
        setTranscript((prev) => [
          ...prev,
          { speaker: "user", text: spokenText.trim(), timestamp: new Date() },
        ]);
      }

      try {
        await sendToChat(videoEl, spokenText);
      } catch {
        setStreamingText("");
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "ai",
            text: "I couldn't analyze the image. Make sure the server is running and try again.",
            timestamp: new Date(),
          },
        ]);
        setAiSpeaking(false);
      } finally {
        setScanning(false);
      }
    },
    [scanning, transcript]
  );

  /**
   * Scan button flow: capture frame and send to chat without voice input.
   */
  const scanPhoto = useCallback(
    async (videoEl) => {
      if (scanning || !videoEl) return;

      videoElRef.current = videoEl;
      setScanning(true);
      setAiSpeaking(true);
      cancelRef.current = false;

      try {
        await sendToChat(videoEl, "");
      } catch {
        setStreamingText("");
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "ai",
            text: "I couldn't analyze the image. Make sure the server is running and try again.",
            timestamp: new Date(),
          },
        ]);
        setAiSpeaking(false);
      } finally {
        setScanning(false);
      }
    },
    [scanning, transcript]
  );

  /**
   * Mark current step as completed and ask LLM for the next step.
   */
  const completeStep = useCallback(
    async (videoEl) => {
      if (scanning) return;

      const vid = videoEl || videoElRef.current;
      if (!vid) return;

      // Mark the last incomplete step as completed
      setRepairSteps((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (!updated[i].completed) {
            updated[i] = { ...updated[i], completed: true };
            break;
          }
        }
        return updated;
      });

      // Send confirmation to LLM to get next step
      const confirmText = "I completed that step. What's the next step?";
      setTranscript((prev) => [
        ...prev,
        { speaker: "user", text: confirmText, timestamp: new Date() },
      ]);

      setScanning(true);
      setAiSpeaking(true);
      cancelRef.current = false;

      try {
        await sendToChat(vid, confirmText);
      } catch {
        setStreamingText("");
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "ai",
            text: "I couldn't get the next step. Please try again.",
            timestamp: new Date(),
          },
        ]);
        setAiSpeaking(false);
      } finally {
        setScanning(false);
      }
    },
    [scanning, transcript]
  );

  const grantPermissions = useCallback(() => setPhase("ready"), []);

  const startSession = useCallback(() => {
    setTranscript([]);
    setDiagnosis(null);
    setStreamingText("");
    setAiSpeaking(false);
    setScanning(false);
    setActiveAnnotations([]);
    setRepairSteps([]);
    stopAudio();
    cancelRef.current = false;
    setPhase("active");
  }, []);

  const completeSession = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopAudio();
    setAiSpeaking(false);
    setStreamingText("");
    setScanning(false);
    setActiveAnnotations([]);
    setPhase("complete");
  }, []);

  const resetSession = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopAudio();
    setPhase("ready");
    setTranscript([]);
    setDiagnosis(null);
    setStreamingText("");
    setAiSpeaking(false);
    setScanning(false);
    setActiveAnnotations([]);
    setRepairSteps([]);
  }, []);

  return {
    phase,
    transcript,
    aiSpeaking,
    streamingText,
    scanning,
    diagnosis,
    repairSteps,
    activeAnnotations,
    sessionStatus: phase === "complete" ? "complete" : "active",
    totalSteps: diagnosis?.steps?.length || 0,
    currentStep: 0,
    currentExchange: 0,
    grantPermissions,
    startSession,
    completeSession,
    resetSession,
    scan,
    scanPhoto,
    completeStep,
  };
}
