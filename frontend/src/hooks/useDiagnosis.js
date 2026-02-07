import { useState, useCallback } from "react";
import mockDiagnosisResponse from "../data/mockDiagnosisResponse";

export default function useDiagnosis() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [data, setData] = useState(null);

  const submitDiagnosis = useCallback((image, description) => {
    setStatus("loading");
    setData(null);

    return new Promise((resolve) => {
      setTimeout(() => {
        setData(mockDiagnosisResponse);
        setStatus("success");
        resolve(mockDiagnosisResponse);
      }, 2500);
    });
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
  }, []);

  return { status, data, submitDiagnosis, reset };
}
