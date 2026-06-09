"use client";

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/home" || pathname === "/";

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 sm:right-6 z-[9998] w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-[var(--border2)] bg-white text-[var(--txt2)] hover:text-[var(--txt)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
        isHome ? "bottom-24 sm:bottom-8" : "bottom-4 sm:bottom-8"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
