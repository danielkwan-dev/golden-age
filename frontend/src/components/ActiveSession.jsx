import { motion } from "framer-motion";
import TranscriptPanel from "./TranscriptPanel";
import ControlBar from "./ControlBar";

export default function ActiveSession({
  session,
  mic,
  videoRef,
  torchSupported,
  torchOn,
  onToggleTorch,
}) {
  const handlePressStart = (e) => {
    e.preventDefault();
    if (session.scanning || session.aiSpeaking) return;
    mic.startListening();
  };

  const handlePressEnd = async (e) => {
    e.preventDefault();
    if (!mic.listening) return;
    const audioBlob = await mic.stopListening();
    session.scan(videoRef.current, audioBlob);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col pointer-events-none"
    >
      {/* Top: Device info or instruction */}
      <div className="flex justify-center pt-[max(1rem,env(safe-area-inset-top))] px-4 pointer-events-auto">
        {session.diagnosis ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-gold/20 rounded-2xl px-4 py-2 text-center"
          >
            <p className="text-gold text-sm font-semibold">
              {session.diagnosis.device}
            </p>
            {session.diagnosis.damage_detected && (
              <p className="text-white/60 text-xs mt-0.5">
                {session.diagnosis.severity} damage &middot;{" "}
                {session.diagnosis.estimated_difficulty}
              </p>
            )}
          </motion.div>
        ) : (
          <div className="glass border border-white/10 rounded-2xl px-4 py-2">
            <p className="text-white/60 text-sm">
              Point camera at your broken device
            </p>
          </div>
        )}
      </div>

      {/* Center: Hold-to-talk + scan buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Live speech bubble (shows while holding button) */}
        {mic.liveTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/10 rounded-xl px-4 py-2 mx-8 max-w-sm"
          >
            <p className="text-white/80 text-sm text-center italic">
              &ldquo;{mic.liveTranscript}&rdquo;
            </p>
          </motion.div>
        )}

        {/* Button group */}
        <div className="flex items-center gap-6">
          {/* Scan photo button */}
          <motion.button
            onClick={() => session.scanPhoto(videoRef.current)}
            disabled={session.scanning || session.aiSpeaking}
            whileTap={{ scale: 0.9 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto select-none ${
              session.scanning || session.aiSpeaking
                ? "bg-white/5 border border-white/10 cursor-wait opacity-40"
                : "glass border border-gold/30 cursor-pointer"
            }`}
          >
            <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
          </motion.button>

          {/* Hold-to-talk button */}
          <motion.button
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={mic.listening ? handlePressEnd : undefined}
            disabled={session.scanning || session.aiSpeaking}
            className={`w-24 h-24 rounded-full flex items-center justify-center pointer-events-auto select-none touch-none ${
              session.scanning || session.aiSpeaking
                ? "bg-gold/20 border-2 border-gold/40 cursor-wait"
                : mic.listening
                  ? "bg-danger/30 border-2 border-danger/50 scale-110 cursor-pointer"
                  : "gold-gradient gold-pulse cursor-pointer"
            }`}
            animate={
              mic.listening
                ? { scale: [1.08, 1.12, 1.08] }
                : { scale: 1 }
            }
            transition={
              mic.listening
                ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            {session.scanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-[3px] border-gold/30 border-t-gold rounded-full"
              />
            ) : (
              <svg
                className={`w-8 h-8 ${mic.listening ? "text-white" : "text-black"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V5.25a3 3 0 1 1 6 0v7.5a3 3 0 0 1-3 3Z"
                />
              </svg>
            )}
          </motion.button>
        </div>

        <p className="text-white/40 text-xs pointer-events-none">
          {session.scanning
            ? "Analyzing..."
            : session.aiSpeaking
              ? "MIDAS is responding..."
              : mic.listening
                ? "Listening... release to send"
                : "Hold to speak \u00B7 Tap camera to scan"}
        </p>
      </div>

      {/* Bottom-left: TranscriptPanel (conversation history) */}
      <TranscriptPanel
        transcript={session.transcript}
        streamingText={session.streamingText}
        aiSpeaking={session.aiSpeaking}
      />

      {/* Bottom: Control bar */}
      <div className="pointer-events-auto">
        <ControlBar
          isMuted={mic.isMuted}
          onToggleMute={mic.toggleMute}
          onEndSession={session.completeSession}
          torchSupported={torchSupported}
          torchOn={torchOn}
          onToggleTorch={onToggleTorch}
        />
      </div>
    </motion.div>
  );
}
