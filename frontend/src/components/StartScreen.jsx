import { motion } from "framer-motion";

export default function StartScreen({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col items-center justify-between py-16 px-6 bg-black/60 backdrop-blur-sm"
    >
      {/* Top: Logo + tagline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center pt-8"
      >
        <h1 className="text-5xl sm:text-6xl font-bold text-gold gold-glow rounded-2xl inline-block text-camera">
          Midas
        </h1>
        <p className="text-white text-lg sm:text-xl font-light mt-3 tracking-wide text-camera">
          Point. Talk. Fix.
        </p>
      </motion.div>

      {/* Middle: Instruction + Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <p className="text-white/70 text-sm sm:text-base mb-10 text-center text-camera">
          Point your camera at the broken device
        </p>

        {/* Begin Fix button */}
        <motion.button
          onClick={onStart}
          className="w-20 h-20 rounded-full gold-gradient gold-pulse flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-8 h-8 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z"
            />
          </svg>
        </motion.button>

        <p className="text-white/40 text-xs mt-4 text-camera">
          Tap to start voice-guided repair
        </p>
      </motion.div>

      {/* Bottom: Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-gold-muted/60 text-xs text-center text-camera"
      >
        Make sure your device is well-lit
      </motion.p>
    </motion.div>
  );
}
