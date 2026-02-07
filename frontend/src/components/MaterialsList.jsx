import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function MaterialsList({ materials }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref}>
      <motion.h3
        className="text-2xl sm:text-3xl font-bold text-gold mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        Materials Needed
      </motion.h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material, i) => (
          <motion.div
            key={material.name}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="rounded-xl bg-charcoal p-5 border border-transparent hover:border-gold/30 transition-colors duration-300"
          >
            <p className="text-white font-semibold mb-1">{material.name}</p>
            <p className="text-gold text-sm font-medium mb-3">
              {material.cost}
            </p>
            {material.purchaseUrl && (
              <a
                href={material.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-muted text-sm underline underline-offset-2 hover:text-gold transition-colors"
              >
                Buy →
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
