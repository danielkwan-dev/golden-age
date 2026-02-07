import ARMarker from "./ARMarker";

export default function AROverlayLayer({ annotations }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {annotations.slice(0, 3).map((annotation) => (
        <ARMarker key={annotation.id} annotation={annotation} />
      ))}
    </div>
  );
}
