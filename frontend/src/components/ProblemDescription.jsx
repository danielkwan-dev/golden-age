import { motion } from "framer-motion";

const MAX_CHARS = 500;

export default function ProblemDescription({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex-1 flex flex-col"
    >
      <textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) onChange(e.target.value);
        }}
        placeholder="Describe the issue — e.g. 'cracked screen', 'keyboard key fell off', 'charging port not working'"
        className="w-full min-h-[240px] rounded-xl border border-charcoal bg-black-soft text-white/90 placeholder-white/30 p-4 text-sm resize-none transition-all duration-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
      />
      <div className="mt-2 text-right text-xs text-white/30">
        {value.length}/{MAX_CHARS}
      </div>
    </motion.div>
  );
}
