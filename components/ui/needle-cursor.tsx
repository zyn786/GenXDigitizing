"use client";

import * as React from "react";

export function NeedleCursor() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Only activate on devices with a fine pointer (mouse/trackpad, not touch)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Tip of needle is at bottom-center of SVG (6px, 52px)
        // Position element so that point lands exactly on cursor
        el.style.left = `${e.clientX - 6}px`;
        el.style.top = `${e.clientY - 52}px`;
        el.style.opacity = "1";
      });
    };

    const onLeave = () => { el.style.opacity = "0"; };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Hide default cursor on pointer devices only */}
      <style>{`@media (pointer: fine){*,*::before,*::after{cursor:none!important}}`}</style>

      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-200px",
          top: "-200px",
          pointerEvents: "none",
          zIndex: 99999,
          opacity: 0,
          /* Rotate around the tip so the tip stays on the cursor hotspot */
          transformOrigin: "6px 52px",
          transform: "rotate(30deg)",
          transition: "opacity 0.12s ease",
          willChange: "left, top",
        }}
      >
        <svg
          width="12"
          height="52"
          viewBox="0 0 12 52"
          overflow="visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="needle-grad" x1="0" y1="0" x2="12" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#8888aa" />
              <stop offset="30%"  stopColor="#d4d4ec" />
              <stop offset="60%"  stopColor="#ededf8" />
              <stop offset="100%" stopColor="#7878a0" />
            </linearGradient>
            <filter id="needle-glow" x="-80%" y="-10%" width="260%" height="120%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Needle body + eye hole via evenodd fill rule */}
          <path
            fillRule="evenodd"
            filter="url(#needle-glow)"
            d="M6,52 L3.5,44 L2.5,10 C2.5,5 4,1.5 6,1 C8,1.5 9.5,5 9.5,10 L8.5,44 Z
               M6,10 C4.3,10 3.1,8.4 3.1,6.5 C3.1,4.6 4.3,3 6,3 C7.7,3 8.9,4.6 8.9,6.5 C8.9,8.4 7.7,10 6,10 Z"
            fill="url(#needle-grad)"
          />

          {/* Thin highlight on the left edge */}
          <line x1="4.2" y1="11" x2="4.5" y2="43" stroke="rgba(255,255,255,0.45)" strokeWidth="0.7" strokeLinecap="round" />

          {/* Thread coming out of the eye */}
          <path
            d="M6,2 C5.5,0 7,-2 5.5,-5"
            stroke="rgba(139,92,246,0.8)"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </>
  );
}
