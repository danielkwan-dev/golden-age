import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Gold confetti particles ── */
function Confetti() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 300,
      y: -(Math.random() * 400 + 100),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 0.3,
      size: Math.random() * 6 + 4,
      color: ["#D4AF37", "#F5E6A3", "#B8960C", "#C9A84C"][Math.floor(Math.random() * 4)],
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "40%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: p.scale,
            rotate: p.rotate,
          }}
          transition={{
            duration: 1.8,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated checkmark SVG ── */
function AnimatedCheckmark() {
  return (
    <div className="w-24 h-24 mx-auto mb-6 gold-glow rounded-full flex items-center justify-center bg-charcoal">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <motion.circle
          cx="28"
          cy="28"
          r="24"
          stroke="#D4AF37"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.path
          d="M18 28l7 7 13-14"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

/* ── Transcript modal ── */
function TranscriptModal({ transcript, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col backdrop-blur-xl bg-black/80"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-gold/20">
        <h2 className="text-gold font-bold text-lg">Full Transcript</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center cursor-pointer"
        >
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {transcript.map((msg, i) => (
          <div
            key={i}
            className={`${msg.speaker === "ai" ? "" : "text-right"}`}
          >
            <span className={`text-[10px] font-semibold block mb-0.5 ${msg.speaker === "ai" ? "text-gold/60" : "text-white/40"}`}>
              {msg.speaker === "ai" ? "MIDAS" : "You"}
            </span>
            <p className={`text-sm leading-relaxed inline-block max-w-[85%] rounded-lg px-3 py-2 whitespace-pre-line ${
              msg.speaker === "ai"
                ? "bg-charcoal/60 text-white/90 text-left"
                : "bg-white/5 text-white/70"
            }`}>
              {msg.text}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── SessionComplete ── */
export default function SessionComplete({ session, onRestart }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [duration, setDuration] = useState("—");

  useEffect(() => {
    const t = session.transcript;
    if (t.length >= 2) {
      const start = t[0].timestamp;
      const end = t[t.length - 1].timestamp;
      const mins = Math.max(1, Math.round((end - start) / 60000));
      setDuration(`${mins} minute${mins !== 1 ? "s" : ""}`);
    }
  }, [session.transcript]);

  const exchanges = session.transcript.length;
  const deviceName = session.diagnosis?.device || "your device";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 flex items-center justify-center backdrop-blur-xl bg-black/70 px-6"
    >
      <Confetti />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-sm w-full text-center relative z-10"
      >
        <AnimatedCheckmark />

        <h1 className="text-3xl sm:text-4xl font-bold text-gold gold-glow rounded-2xl inline-block mb-2 text-camera">
          Session Complete
        </h1>
        <p className="text-white/80 text-sm sm:text-base font-light mb-8">
          Repair guidance for {deviceName} has been provided
        </p>

        {/* Summary card */}
        <div className="glass border border-gold/20 rounded-2xl p-5 mb-8 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Exchanges</span>
            <span className="text-gold font-semibold">{exchanges}</span>
          </div>
          <div className="w-full h-px bg-white/5" />
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Duration</span>
            <span className="text-gold font-semibold">{duration}</span>
          </div>
          {session.diagnosis?.estimated_cost && (
            <>
              <div className="w-full h-px bg-white/5" />
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Est. repair cost</span>
                <span className="text-gold font-semibold">{session.diagnosis.estimated_cost}</span>
              </div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <motion.button
            onClick={onRestart}
            className="w-full py-4 rounded-full gold-gradient text-black font-semibold text-base cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start New Repair
          </motion.button>
          <motion.button
            onClick={() => setShowTranscript(true)}
            className="w-full py-4 rounded-full border border-gold/40 text-gold font-semibold text-base cursor-pointer bg-transparent hover:border-gold/60 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Transcript
          </motion.button>
        </div>
      </motion.div>

      {/* Transcript modal */}
      <AnimatePresence>
        {showTranscript && (
          <TranscriptModal
            transcript={session.transcript}
            onClose={() => setShowTranscript(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
