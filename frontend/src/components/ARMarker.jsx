import { motion } from "framer-motion";

const COLOR_MAP = {
  gold: { border: "border-gold", bg: "bg-gold/10", text: "text-gold", stroke: "#D4AF37" },
  danger: { border: "border-danger", bg: "bg-danger/10", text: "text-danger", stroke: "#F87171" },
  success: { border: "border-success", bg: "bg-success/10", text: "text-success", stroke: "#4ADE80" },
};

function Label({ text, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.gold;
  return (
    <div className={`glass border ${c.border}/40 rounded-full px-2 py-0.5 whitespace-nowrap`}>
      <span className={`${c.text} text-[10px] font-semibold`} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        {text}
      </span>
    </div>
  );
}

function RectangleMarker({ annotation }) {
  const c = COLOR_MAP[annotation.color] || COLOR_MAP.gold;
  const { top, left, width, height } = annotation.position;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="absolute"
      style={{ top, left, width, height }}
    >
      {/* Label above */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2">
        <Label text={annotation.label} color={annotation.color} />
      </div>

      {/* Pulsing rectangle */}
      <motion.div
        animate={{
          boxShadow: [
            `0 0 8px ${c.stroke}33, inset 0 0 8px ${c.stroke}11`,
            `0 0 20px ${c.stroke}55, inset 0 0 12px ${c.stroke}22`,
            `0 0 8px ${c.stroke}33, inset 0 0 8px ${c.stroke}11`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`w-full h-full rounded-lg border-2 border-dashed ${c.border}/70 ${c.bg}`}
      />
    </motion.div>
  );
}

function ArrowMarker({ annotation }) {
  const c = COLOR_MAP[annotation.color] || COLOR_MAP.gold;
  const { top, left } = annotation.position;
  const rotation = annotation.rotation || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute"
      style={{ top, left }}
    >
      {/* Label */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2">
        <Label text={annotation.label} color={annotation.color} />
      </div>

      {/* Bouncing arrow */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          {/* Shadow */}
          <path
            d="M16 4L8 16h5v12h6V16h5L16 4z"
            fill="rgba(0,0,0,0.5)"
            transform="translate(1,1)"
          />
          {/* Arrow */}
          <path
            d="M16 4L8 16h5v12h6V16h5L16 4z"
            fill={c.stroke}
            stroke={c.stroke}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function CircleMarker({ annotation }) {
  const c = COLOR_MAP[annotation.color] || COLOR_MAP.gold;
  const { top, left } = annotation.position;
  const radius = annotation.radius || 30;
  const size = radius * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute"
      style={{
        top,
        left,
        marginTop: -radius,
        marginLeft: -radius,
      }}
    >
      {/* Label offset to the right */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2">
        <Label text={annotation.label} color={annotation.color} />
      </div>

      {/* Breathing circle */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            `0 0 6px ${c.stroke}44`,
            `0 0 16px ${c.stroke}66`,
            `0 0 6px ${c.stroke}44`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`rounded-full border-2 ${c.border}/70 ${c.bg}`}
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
}

export default function ARMarker({ annotation }) {
  switch (annotation.type) {
    case "rectangle":
      return <RectangleMarker annotation={annotation} />;
    case "arrow":
      return <ArrowMarker annotation={annotation} />;
    case "circle":
      return <CircleMarker annotation={annotation} />;
    default:
      return null;
  }
}
