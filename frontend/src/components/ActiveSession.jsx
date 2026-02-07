import { motion } from "framer-motion";
import StepIndicator from "./StepIndicator";
import ControlBar from "./ControlBar";
import { mockConversation } from "../data/mockConversation";

export default function ActiveSession({
  session,
  mic,
  torchSupported,
  torchOn,
  onToggleTorch,
}) {
  const totalSteps = mockConversation.length;
  const step = mockConversation[session.currentStep] || mockConversation[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col pointer-events-none"
    >
      {/* Top: Step indicator */}
      <div className="flex justify-center pt-[max(1rem,env(safe-area-inset-top))] px-4 pointer-events-auto">
        <StepIndicator
          currentStep={step.step}
          totalSteps={totalSteps}
          title={step.title}
        />
      </div>

      {/* Center: VoiceOrb placeholder */}
      <div className="flex-1 flex items-center justify-center">
        {/* VoiceOrb will go here */}
      </div>

      {/* Bottom-left: TranscriptPanel placeholder */}
      {/* TranscriptPanel will go here */}

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
