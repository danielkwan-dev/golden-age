// useMicrophone — audio capture + mock transcription
import { useState, useCallback } from "react";

export default function useMicrophone() {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const startListening = useCallback(() => setIsListening(true), []);
  const stopListening = useCallback(() => setIsListening(false), []);
  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  return { isListening, isMuted, startListening, stopListening, toggleMute };
}
