import { motion, AnimatePresence } from "framer-motion";

function PulseRing({ delay, size }) {
  return (
    <motion.div
      className="absolute rounded-full border border-gold/20"
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0.6 }}
      animate={{ scale: 1.6, opacity: 0 }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export default function VoiceOrb({ aiSpeaking, sessionStatus }) {
  const isComplete = sessionStatus === "complete";
  const state = isComplete ? "complete" : aiSpeaking ? "speaking" : "listening";

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-none">
      <div className="relative flex items-center justify-center">
        {/* Pulse rings when speaking */}
        <AnimatePresence>
          {state === "speaking" && (
            <>
              <PulseRing delay={0} size={80} />
              <PulseRing delay={0.5} size={80} />
              <PulseRing delay={1} size={80} />
            </>
          )}
        </AnimatePresence>

        {/* Orb */}
        <motion.div
          animate={{
            width: state === "speaking" ? 72 : 64,
            height: state === "speaking" ? 72 : 64,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`rounded-full flex items-center justify-center ${
            state === "speaking"
              ? "gold-gradient gold-glow"
              : "border-2 border-gold/30 bg-gold/5"
          }`}
        >
          {state === "speaking" ? (
            // Sound wave bars
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-black/60"
                  animate={{
                    height: [8, 18 + Math.random() * 8, 8],
                  }}
                  transition={{
                    duration: 0.6 + Math.random() * 0.3,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          ) : (
            // Mic icon when listening
            <motion.svg
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-6 text-gold/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V5.25a3 3 0 1 1 6 0v7.5a3 3 0 0 1-3 3Z"
              />
            </motion.svg>
          )}
        </motion.div>
      </div>

      {/* Label */}
      <motion.p
        key={state}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-white/40 text-camera"
      >
        {state === "speaking"
          ? "AI is speaking..."
          : state === "complete"
            ? ""
            : "Listening..."}
      </motion.p>
    </div>
  );
}
