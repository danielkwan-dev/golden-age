// useAROverlays — manages AR marker positions/animations
import { useState, useCallback } from "react";

export default function useAROverlays() {
  const [activeAnnotations, setActiveAnnotations] = useState([]);

  const showAnnotations = useCallback((ids) => {
    setActiveAnnotations(ids);
  }, []);

  const clearAnnotations = useCallback(() => {
    setActiveAnnotations([]);
  }, []);

  return { activeAnnotations, showAnnotations, clearAnnotations };
}
