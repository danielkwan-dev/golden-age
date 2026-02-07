// useRepairSession — session state machine + mock AI responses
import { useState, useCallback } from "react";

export default function useRepairSession() {
  // phase: 'permissions' | 'ready' | 'active' | 'complete'
  const [phase, setPhase] = useState("permissions");
  const [currentStep, setCurrentStep] = useState(0);
  const [exchangeIndex, setExchangeIndex] = useState(0);

  const grantPermissions = useCallback(() => setPhase("ready"), []);
  const startSession = useCallback(() => setPhase("active"), []);
  const completeSession = useCallback(() => setPhase("complete"), []);
  const resetSession = useCallback(() => {
    setPhase("permissions");
    setCurrentStep(0);
    setExchangeIndex(0);
  }, []);

  const nextExchange = useCallback(() => {
    setExchangeIndex((i) => i + 1);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => s + 1);
    setExchangeIndex(0);
  }, []);

  return {
    phase,
    currentStep,
    exchangeIndex,
    grantPermissions,
    startSession,
    completeSession,
    resetSession,
    nextExchange,
    nextStep,
  };
}
