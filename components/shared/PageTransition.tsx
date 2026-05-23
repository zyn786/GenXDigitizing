"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PageTransition() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Only run on first visit — subsequent SPA navigations are instant
    if (done) return;
    setShow(true);

    const hide = () => setShow(false);
    if (document.readyState === "complete") {
      // Let logo animation play briefly then exit
      const t = setTimeout(hide, 600);
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
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[9998] bg-[#050814] flex items-center justify-center"
        >
          <motion.img
            src="/images/white_logo.png"
            alt="GenX Digitizing"
            className="w-28 sm:w-36 h-auto mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
