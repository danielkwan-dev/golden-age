import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "./components/Hero";
import UploadSection from "./components/UploadSection";
import DiagnosisCard from "./components/DiagnosisCard";
import MaterialsList from "./components/MaterialsList";
import useDiagnosis from "./hooks/useDiagnosis";

function App() {
  const { status, data, submitDiagnosis } = useDiagnosis();
  const resultsRef = useRef(null);

  useEffect(() => {
    if (status === "loading" || status === "success") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [status]);

  return (
    <div className="bg-black min-h-screen">
      <Hero />
      <UploadSection
        onSubmit={submitDiagnosis}
        isLoading={status === "loading"}
      />

      {/* Loading / Results area */}
      <div ref={resultsRef}>
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 pb-20"
            >
              <div className="space-y-4">
                <div className="h-8 w-48 rounded-lg gold-shimmer" />
                <div className="h-4 w-full rounded gold-shimmer" />
                <div className="h-4 w-3/4 rounded gold-shimmer" />
                <div className="h-32 w-full rounded-xl gold-shimmer" />
                <div className="h-4 w-5/6 rounded gold-shimmer" />
                <div className="h-4 w-2/3 rounded gold-shimmer" />
              </div>
            </motion.div>
          )}

          {status === "success" && data && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 pb-20 space-y-10"
            >
              <DiagnosisCard data={data} />
              <MaterialsList materials={data.materials} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
