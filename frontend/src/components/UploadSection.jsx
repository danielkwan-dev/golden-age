import { useState } from "react";
import { motion } from "framer-motion";
import ImageDropzone from "./ImageDropzone";
import ProblemDescription from "./ProblemDescription";

export default function UploadSection({ onSubmit, isLoading }) {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");

  const canSubmit = image && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(image, description);
  };

  return (
    <section id="upload-section" className="relative py-20 px-4">
      {/* Gold accent divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gold mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          What's broken?
        </motion.h2>

        <div className="flex flex-col md:flex-row gap-6">
          <ImageDropzone image={image} onImageChange={setImage} />
          <ProblemDescription value={description} onChange={setDescription} />
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300 w-full sm:w-auto cursor-pointer ${
              canSubmit
                ? "gold-gradient text-black hover:scale-105 hover:gold-glow"
                : "bg-charcoal text-white/30 cursor-not-allowed"
            }`}
            whileHover={canSubmit ? { scale: 1.05 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
          >
            {isLoading ? "Analyzing..." : "Diagnose & Fix"}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
