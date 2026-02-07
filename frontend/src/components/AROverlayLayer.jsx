import { AnimatePresence } from "framer-motion";
import ARMarker from "./ARMarker";

export default function AROverlayLayer({ annotations }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {annotations.map((annotation) => (
          <ARMarker key={annotation.id} annotation={annotation} />
        ))}
      </AnimatePresence>
    </div>
  );
}
