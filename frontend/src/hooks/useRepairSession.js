import { useState, useCallback, useRef, useEffect } from "react";
import { mockConversation } from "../data/mockConversation";

export default function useRepairSession() {
  const [phase, setPhase] = useState("permissions"); // permissions | ready | active | complete
  const [currentStep, setCurrentStep] = useState(0);
  const [currentExchange, setCurrentExchange] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activeAnnotations, setActiveAnnotations] = useState([]);
  const [sessionStatus, setSessionStatus] = useState("active");

  const playingRef = useRef(false);
  const cancelRef = useRef(false);
  const timeoutRef = useRef(null);

  const totalSteps = mockConversation.length;

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
      // ~80-120ms per word for natural speech pacing
      await sleep(80 + Math.random() * 40);
    }
  };

  const playConversation = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    cancelRef.current = false;

    for (let s = 0; s < mockConversation.length; s++) {
      if (cancelRef.current) break;
      const step = mockConversation[s];
      setCurrentStep(s);

      for (let e = 0; e < step.exchanges.length; e++) {
        if (cancelRef.current) break;
        const exchange = step.exchanges[e];
        setCurrentExchange(e);

        if (exchange.speaker === "ai") {
          // Set AR annotations for this AI message
          setActiveAnnotations(exchange.arAnnotations || []);
          setAiSpeaking(true);
          setStreamingText("");

          // Stream word by word
          await streamWords(exchange.text);
          if (cancelRef.current) break;

          // Finalize: add to transcript, clear streaming
          setTranscript((prev) => [
            ...prev,
            { speaker: "ai", text: exchange.text, timestamp: new Date() },
          ]);
          setStreamingText("");
          setAiSpeaking(false);

          // Pause between exchanges
          await sleep(1200 + Math.random() * 800);
        } else {
          // User message: pause to simulate user talking, then appear
          setAiSpeaking(false);
          await sleep(3000 + Math.random() * 2000);
          if (cancelRef.current) break;

          setTranscript((prev) => [
            ...prev,
            { speaker: "user", text: exchange.text, timestamp: new Date() },
          ]);

          // Brief pause after user speaks
          await sleep(1000 + Math.random() * 500);
        }
      }

      // Pause between steps
      if (s < mockConversation.length - 1 && !cancelRef.current) {
        setActiveAnnotations([]);
        await sleep(2000);
      }
    }

    if (!cancelRef.current) {
      setActiveAnnotations([]);
      setSessionStatus("complete");
      setPhase("complete");
    }
    playingRef.current = false;
  }, []);

  // Start conversation when phase becomes active
  useEffect(() => {
    if (phase === "active") {
      playConversation();
    }
  }, [phase, playConversation]);

  const grantPermissions = useCallback(() => setPhase("ready"), []);

  const startSession = useCallback(() => {
    setTranscript([]);
    setCurrentStep(0);
    setCurrentExchange(0);
    setStreamingText("");
    setAiSpeaking(false);
    setActiveAnnotations([]);
    setSessionStatus("active");
    cancelRef.current = false;
    setPhase("active");
  }, []);

  const completeSession = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playingRef.current = false;
    setAiSpeaking(false);
    setStreamingText("");
    setActiveAnnotations([]);
    setPhase("complete");
  }, []);

  const resetSession = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playingRef.current = false;
    setPhase("ready");
    setCurrentStep(0);
    setCurrentExchange(0);
    setTranscript([]);
    setStreamingText("");
    setAiSpeaking(false);
    setActiveAnnotations([]);
    setSessionStatus("active");
  }, []);

  return {
    phase,
    currentStep,
    currentExchange,
    transcript,
    aiSpeaking,
    streamingText,
    activeAnnotations,
    sessionStatus,
    totalSteps,
    grantPermissions,
    startSession,
    completeSession,
    resetSession,
  };
}
