import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function DiagnosisCard({ data }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-xl bg-charcoal border-l-4 border-gold p-6 sm:p-8"
    >
      <p className="text-gold-muted text-xs font-semibold uppercase tracking-widest mb-2">
        Diagnosis
      </p>

      <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
        {data.device} — {data.problem}
      </h3>

      <div className="flex flex-wrap gap-4 text-sm text-white/50 mt-3 mb-6">
        <span>
          Difficulty:{" "}
          <span className="text-white/80 font-medium">{data.difficulty}</span>
        </span>
        <span>
          Est. time:{" "}
          <span className="text-white/80 font-medium">{data.estimatedTime}</span>
        </span>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40 uppercase tracking-wide">
            Confidence
          </span>
          <span className="text-sm font-semibold text-gold">
            {data.confidence}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-black-soft overflow-hidden">
          <motion.div
            className="h-full rounded-full gold-gradient"
            initial={{ width: 0 }}
            animate={inView ? { width: `${data.confidence}%` } : { width: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
