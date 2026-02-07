import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function MessageBubble({ message, isStreaming }) {
  const isAi = message.speaker === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, x: isAi ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}
    >
      <span className={`text-[10px] font-semibold mb-0.5 ${isAi ? "text-gold/70" : "text-white/40"}`}>
        {isAi ? "AI" : "You"}
      </span>
      <div
        className={`rounded-lg px-2.5 py-1.5 max-w-full text-xs leading-relaxed ${
          isAi
            ? "bg-charcoal/80 border-l-2 border-gold-muted/50 text-white/90"
            : "bg-white/5 text-white/70"
        }`}
      >
        {message.text}
        {isStreaming && (
          <span className="inline-block w-1 h-3 ml-0.5 bg-gold/70 animate-pulse align-middle" />
        )}
      </div>
    </motion.div>
  );
}

export default function TranscriptPanel({ transcript, streamingText, aiSpeaking }) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, streamingText, collapsed]);

  const lastMessage = transcript[transcript.length - 1];

  return (
    <div className="absolute bottom-28 left-3 w-[42%] max-w-[200px] pointer-events-auto">
      <div className="glass border border-gold/10 border-t-gold/30 rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-3 py-1.5 cursor-pointer"
        >
          <span className="text-gold text-[10px] font-semibold uppercase tracking-wider">
            Transcript
          </span>
          <motion.svg
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-3 h-3 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </motion.svg>
        </button>

        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 pb-2"
            >
              {lastMessage && (
                <p className="text-[10px] text-white/50 truncate">
                  <span className={lastMessage.speaker === "ai" ? "text-gold/60" : "text-white/40"}>
                    {lastMessage.speaker === "ai" ? "AI: " : "You: "}
                  </span>
                  {lastMessage.text}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                ref={scrollRef}
                className="px-2.5 pb-2.5 space-y-2 overflow-y-auto max-h-[30vh] scrollbar-none"
              >
                {transcript.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}

                {/* Currently streaming AI message */}
                {aiSpeaking && streamingText && (
                  <MessageBubble
                    message={{ speaker: "ai", text: streamingText }}
                    isStreaming
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
