import { AnimatePresence } from "framer-motion";
import ARMarker from "./ARMarker";

export default function AROverlayLayer({ annotations }) {
  // Strictly cap at 3 detections and use stable index-based keys
  // so React always replaces slots rather than accumulating stale markers.
  const visible = annotations.slice(0, 3);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence mode="sync">
        {visible.map((annotation, i) => (
          <ARMarker key={`slot-${i}`} annotation={annotation} />
        ))}
      </AnimatePresence>
    </div>
  );
}
