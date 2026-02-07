import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.7, ease: "easeOut" },
  }),
};

function GoldParticle({ size, top, left, duration, delay }) {
  return (
    <motion.div
      className="absolute rounded-full bg-gold/20 blur-sm"
      style={{ width: size, height: size, top, left }}
      animate={{ y: [0, -15, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

const particles = [
  { size: 4, top: "20%", left: "15%", duration: 4, delay: 0 },
  { size: 6, top: "70%", left: "80%", duration: 5, delay: 1 },
  { size: 3, top: "40%", left: "90%", duration: 3.5, delay: 0.5 },
  { size: 5, top: "80%", left: "25%", duration: 4.5, delay: 1.5 },
  { size: 3, top: "15%", left: "70%", duration: 3.8, delay: 0.8 },
];

export default function Hero() {
  const handleScroll = () => {
    document
      .getElementById("upload-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Radial gold glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-gold/5 blur-[120px]" />
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <GoldParticle key={i} {...p} />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          Fix it yourself.
          <br />
          We'll show you how.
        </motion.h1>

        <motion.p
          className="mt-6 text-base sm:text-lg md:text-xl text-gold-muted font-light max-w-xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          Upload a photo of your broken device. Get a step-by-step repair guide
          instantly.
        </motion.p>

        <motion.button
          onClick={handleScroll}
          className="mt-10 px-8 py-3 sm:px-10 sm:py-4 rounded-full gold-gradient text-black font-semibold text-base sm:text-lg cursor-pointer transition-all duration-300 hover:gold-glow hover:scale-105 w-full sm:w-auto"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>
      </div>
    </section>
  );
}
