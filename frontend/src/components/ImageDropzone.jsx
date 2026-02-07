import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPT = { "image/jpeg": [], "image/png": [], "image/webp": [] };

export default function ImageDropzone({ image, onImageChange }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) {
        const file = accepted[0];
        onImageChange(Object.assign(file, { preview: URL.createObjectURL(file) }));
      }
    },
    [onImageChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
  });

  const remove = (e) => {
    e.stopPropagation();
    if (image?.preview) URL.revokeObjectURL(image.preview);
    onImageChange(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1"
    >
      <div
        {...getRootProps()}
        className={`relative flex items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 min-h-[240px] ${
          isDragActive
            ? "border-gold bg-gold/5 gold-glow"
            : image
              ? "border-gold/30 bg-black-soft"
              : "border-charcoal hover:border-gold/50 bg-black-soft"
        }`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {image ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex items-center justify-center p-4"
            >
              <img
                src={image.preview}
                alt="Upload preview"
                className="max-h-[200px] rounded-lg object-contain"
              />
              <button
                onClick={remove}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-charcoal hover:bg-gold/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 p-8 text-center"
            >
              <svg
                className="w-10 h-10 text-gold/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-white/50 text-sm">
                Drag & drop a photo or{" "}
                <span className="text-gold-muted underline">click to browse</span>
              </p>
              <p className="text-white/30 text-xs">JPG, PNG, or WebP</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
