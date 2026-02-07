import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ControlButton({ onClick, active, danger, children, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
          danger
            ? "bg-danger/20 border border-danger/40"
            : active
              ? "glass border border-gold/40"
              : "glass border border-white/10 opacity-50"
        }`}
      >
        {children}
      </motion.button>
      {label && (
        <span className="text-[10px] text-white/30">{label}</span>
      )}
    </div>
  );
}

export default function ControlBar({
  onEndSession,
  torchSupported,
  torchOn,
  onToggleTorch,
  listening,
  scanning,
  aiSpeaking,
  onPressStart,
  onPressEnd,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEnd = () => setShowConfirm(true);

  const confirmEnd = () => {
    setShowConfirm(false);
    onEndSession();
  };

  const micDisabled = scanning || aiSpeaking;

  return (
    <>
      {/* End session confirmation overlay */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass border border-gold/20 rounded-2xl p-6 mx-6 max-w-sm w-full text-center"
            >
              <p className="text-white font-semibold text-lg mb-1">End repair?</p>
              <p className="text-white/50 text-sm mb-6">Your progress will not be saved.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/70 text-sm font-medium cursor-pointer transition-colors hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEnd}
                  className="flex-1 py-3 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm font-medium cursor-pointer transition-colors hover:bg-danger/30"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass border-t border-white/10 rounded-t-2xl px-8 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-center gap-10">
          {/* Hold-to-talk mic button */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.button
              onPointerDown={micDisabled ? undefined : onPressStart}
              onPointerUp={micDisabled ? undefined : onPressEnd}
              onPointerLeave={listening ? onPressEnd : undefined}
              className={`w-12 h-12 rounded-full flex items-center justify-center select-none touch-none transition-all duration-200 ${
                micDisabled
                  ? "bg-gold/10 border border-gold/20 cursor-wait opacity-40"
                  : listening
                    ? "bg-danger/30 border-2 border-danger/50 cursor-pointer"
                    : "glass border border-gold/40 cursor-pointer"
              }`}
              animate={
                listening
                  ? { scale: [1, 1.1, 1] }
                  : { scale: 1 }
              }
              transition={
                listening
                  ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              {scanning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full"
                />
              ) : (
                <svg
                  className={`w-5 h-5 ${listening ? "text-white" : "text-gold"}`}
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
                </svg>
              )}
            </motion.button>
            <span className="text-[10px] text-white/30">
              {scanning ? "Scanning" : listening ? "Release" : "Hold"}
            </span>
          </div>

          {/* End session */}
          <ControlButton onClick={handleEnd} danger label="End">
            <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </ControlButton>

          {/* Flashlight */}
          {torchSupported && (
            <ControlButton
              onClick={onToggleTorch}
              active={torchOn}
              label={torchOn ? "Light on" : "Light"}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={torchOn ? "#D4AF37" : "currentColor"} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </ControlButton>
          )}
        </div>
      </motion.div>
    </>
  );
}
