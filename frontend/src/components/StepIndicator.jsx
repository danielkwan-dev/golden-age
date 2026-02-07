import { motion } from "framer-motion";

export default function StepIndicator({ currentStep, totalSteps, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass border border-gold/20 rounded-full px-5 py-2.5 flex items-center gap-2 max-w-[90vw]"
    >
      <span className="text-gold font-bold text-sm whitespace-nowrap">
        Step {currentStep} of {totalSteps}
      </span>
      <span className="text-white/30 text-sm">—</span>
      <span className="text-white/80 text-sm font-medium truncate">
        {title}
      </span>
    </motion.div>
  );
}
