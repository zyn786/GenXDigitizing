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
      className={`fixed right-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--border2)] bg-white text-[var(--txt2)] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--txt)] hover:shadow-xl sm:right-6 ${
        isHome ? "bottom-24 sm:bottom-28" : "bottom-24 sm:bottom-24"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
