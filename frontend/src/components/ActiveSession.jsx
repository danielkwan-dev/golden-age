import { motion } from "framer-motion";
import TranscriptPanel from "./TranscriptPanel";
import ControlBar from "./ControlBar";

export default function ActiveSession({
  session,
  mic,
  videoRef,
  isFrontFacing,
  torchSupported,
  torchOn,
  onToggleTorch,
}) {
  const handlePressStart = (e) => {
    e.preventDefault();
    if (session.scanning || session.aiSpeaking) return;
    session.unlockAudio();
    mic.startListening();
  };

  const handlePressEnd = async (e) => {
    e.preventDefault();
    if (!mic.listening) return;
    const audioBlob = await mic.stopListening();
    session.scan(videoRef.current, audioBlob, isFrontFacing);
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

      {/* Top-left: Repair steps list */}
      {session.repairSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] left-3 z-20 max-w-[55%]"
        >
          <div className="glass border border-gold/20 rounded-xl px-3 py-2.5">
            <p className="text-gold text-[10px] font-semibold uppercase tracking-wider mb-1.5">
              Repair Steps
            </p>
            <ol className="space-y-1.5">
              {session.repairSteps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed">
                  {step.completed ? (
                    <span className="text-success shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  ) : (
                    <span className="text-gold/70 font-semibold shrink-0">{i + 1}.</span>
                  )}
                  <span className={step.completed ? "text-white/40 line-through" : "text-white/90"}>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
            {/* Done button — only show when there's an incomplete step and not scanning */}
            {session.repairSteps.some((s) => !s.completed) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => session.completeStep(videoRef.current)}
                disabled={session.scanning || session.aiSpeaking}
                className={`pointer-events-auto mt-2 w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  session.scanning || session.aiSpeaking
                    ? "bg-white/5 text-white/20 cursor-wait"
                    : "bg-success/20 border border-success/40 text-success cursor-pointer hover:bg-success/30"
                }`}
              >
                {session.scanning ? "Loading next step..." : "Step Complete"}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Center: Live speech bubble + status */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
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

        <p className="text-white/40 text-xs pointer-events-none">
          {session.scanning
            ? "Analyzing..."
            : session.aiSpeaking
              ? "MIDAS is responding..."
              : mic.listening
                ? "Listening... release to send"
                : "Hold mic to speak"}
        </p>
      </div>

      {/* Bottom-left: TranscriptPanel (conversation history) */}
      <TranscriptPanel
        transcript={session.transcript}
        streamingText={session.streamingText}
        aiSpeaking={session.aiSpeaking}
        onSendText={(text) => session.sendText(videoRef.current, text)}
        disabled={session.scanning || session.aiSpeaking}
      />

      {/* Bottom: Control bar */}
      <div className="pointer-events-auto">
        <ControlBar
          onEndSession={session.completeSession}
          torchSupported={torchSupported}
          torchOn={torchOn}
          onToggleTorch={onToggleTorch}
          listening={mic.listening}
          scanning={session.scanning}
          aiSpeaking={session.aiSpeaking}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
        />
      </div>
    </motion.div>
  );
}
