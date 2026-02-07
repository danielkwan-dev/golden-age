import { useMemo } from "react";
import { arAnnotations } from "../data/mockARAnnotations";

export default function useAROverlays(activeIds) {
  const resolved = useMemo(() => {
    if (!activeIds || activeIds.length === 0) return [];
    return activeIds
      .map((id) => {
        const data = arAnnotations[id];
        if (!data) return null;
        return { id, ...data };
      })
      .filter(Boolean);
  }, [activeIds]);

  return resolved;
}
