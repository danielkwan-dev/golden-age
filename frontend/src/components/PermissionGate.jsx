import { motion, AnimatePresence } from "framer-motion";

export default function PermissionGate({ cameraStatus, onRequestCamera }) {
  const isDenied = cameraStatus === "denied";
  const isError = cameraStatus === "error";
  const isRequesting = cameraStatus === "requesting";
  const showGate = cameraStatus !== "active";

  return (
    <AnimatePresence>
      {showGate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-xl bg-black/80 px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-sm w-full text-center"
          >
            {/* Camera icon */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-charcoal flex items-center justify-center gold-glow">
              <svg
                className="w-10 h-10 text-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {isDenied || isError ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                )}
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {isDenied
                ? "Camera access denied"
                : isError
                  ? "Camera unavailable"
                  : "Midas needs your camera"}
            </h1>

            {/* Subtitle */}
            <p className="text-gold-muted text-sm sm:text-base font-light mb-8 leading-relaxed">
              {isDenied
                ? "Please enable camera access in your browser settings, then try again."
                : isError
                  ? "We couldn't access your camera. Make sure no other app is using it."
                  : "Point your camera at the broken device and we'll guide you through the repair."}
            </p>

            {/* CTA button */}
            <motion.button
              onClick={onRequestCamera}
              disabled={isRequesting}
              className={`w-full py-4 rounded-full font-semibold text-lg transition-all duration-300 cursor-pointer ${
                isRequesting
                  ? "bg-charcoal text-white/30 cursor-not-allowed"
                  : "gold-gradient text-black hover:gold-glow"
              }`}
              whileHover={isRequesting ? {} : { scale: 1.02 }}
              whileTap={isRequesting ? {} : { scale: 0.98 }}
            >
              {isRequesting
                ? "Requesting…"
                : isDenied || isError
                  ? "Try Again"
                  : "Allow Camera Access"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
