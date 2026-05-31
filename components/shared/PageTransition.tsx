"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PageTransition() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    setShow(true);

    const hide = () => setShow(false);
    if (document.readyState === "complete") {
      const t = setTimeout(hide, 500);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", hide);
    return () => window.removeEventListener("load", hide);
  }, [done]);

  const handleExitComplete = () => setDone(true);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] bg-[#FAFAF9] flex flex-col items-center justify-center gap-4"
        >
          {/* Logo */}
          <motion.img
            src="/images/black_logo.png"
            alt="GenX Digitizing"
            className="w-24 sm:w-32 h-auto"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Animated indicator */}
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
