import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const messages = [
  "Gathering inspiration 🎭",
  "Mixing colors 🎨",
  "Sketching outlines ✏️",
  "Adding final touches ✨",
  "Almost done...",
];

export default function ImageGenerationLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-10">
      <div className="h-10 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-medium text-white"
          >
            {messages[index]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-64 h-2 rounded-full overflow-hidden bg-white/[.06]">
        <motion.div
          className="h-full w-1/2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
      </div>
    </div>
  );
}
