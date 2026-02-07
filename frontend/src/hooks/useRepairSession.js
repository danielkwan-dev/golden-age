import { useState, useCallback, useRef } from "react";
import { captureFrame, analyzeFrame } from "../api/midas";

export default function useRepairSession() {
  const [phase, setPhase] = useState("permissions"); // permissions | ready | active | complete
  const [transcript, setTranscript] = useState([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [activeAnnotations, setActiveAnnotations] = useState([]);

  const cancelRef = useRef(false);
  const timeoutRef = useRef(null);

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
   * Build a context string from conversation history so the LLM
   * knows what was discussed previously.
   */
  const buildContext = (messages, newUserText) => {
    const lines = [];
    for (const msg of messages) {
      const prefix = msg.speaker === "user" ? "User" : "MIDAS";
      lines.push(`${prefix}: ${msg.text}`);
    }
    if (newUserText.trim()) {
      lines.push(`User: ${newUserText.trim()}`);
    }
    return lines.join("\n");
  };

  /**
   * Capture a frame + send to GPT-4o with full conversation context.
   * videoEl: the <video> DOM element
   * spokenText: what the user just said (from Web Speech API)
   */
  const scan = useCallback(
    async (videoEl, spokenText = "") => {
      if (scanning || !videoEl) return;

      setScanning(true);
      setAiSpeaking(true);
      setStreamingText("Scanning device...");
      cancelRef.current = false;

      // Add user's spoken text to transcript
      if (spokenText.trim()) {
        setTranscript((prev) => [
          ...prev,
          { speaker: "user", text: spokenText.trim(), timestamp: new Date() },
        ]);
      }

      try {
        const blob = await captureFrame(videoEl);

        // Build full conversation context for the LLM
        const context = buildContext(transcript, spokenText);

        const result = await analyzeFrame(blob, context);
        setDiagnosis(result);

        // Build readable AI response
        const lines = [];
        lines.push(`I can see a ${result.device}.`);

        if (result.damage_detected) {
          lines.push(result.damage_description);
          lines.push("");
          lines.push("Here's how to fix it:");
          result.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));

          if (result.warning && result.warning !== "None") {
            lines.push("");
            lines.push(`Warning: ${result.warning}`);
          }
          if (result.tools?.length > 0) {
            lines.push("");
            lines.push(`Tools needed: ${result.tools.join(", ")}`);
          }
        } else {
          lines.push(
            "I don't see any visible damage. Try describing the issue or adjusting the camera angle."
          );
        }

        const aiText = lines.join("\n");

        // Stream the response word by word
        setStreamingText("");
        await streamWords(aiText);

        if (!cancelRef.current) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "ai", text: aiText, timestamp: new Date() },
          ]);
          setStreamingText("");
          setAiSpeaking(false);
        }
      } catch (err) {
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

  const grantPermissions = useCallback(() => setPhase("ready"), []);

  const startSession = useCallback(() => {
    setTranscript([]);
    setDiagnosis(null);
    setStreamingText("");
    setAiSpeaking(false);
    setScanning(false);
    setActiveAnnotations([]);
    cancelRef.current = false;
    setPhase("active");
  }, []);

  const completeSession = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAiSpeaking(false);
    setStreamingText("");
    setScanning(false);
    setActiveAnnotations([]);
    setPhase("complete");
  }, []);

  const resetSession = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase("ready");
    setTranscript([]);
    setDiagnosis(null);
    setStreamingText("");
    setAiSpeaking(false);
    setScanning(false);
    setActiveAnnotations([]);
  }, []);

  return {
    phase,
    transcript,
    aiSpeaking,
    streamingText,
    scanning,
    diagnosis,
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
  };
}
