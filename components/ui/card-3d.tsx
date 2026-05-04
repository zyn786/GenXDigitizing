"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

import { cn } from "@/lib/utils";

type Card3DProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
};

export function Card3D({
  children,
  className,
  intensity = 10,
  glare = true,
}: Card3DProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 28 };
  const rotateX = useSpring(
    useTransform(yRaw, [-0.5, 0.5], prefersReduced ? [0, 0] : [intensity, -intensity]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(xRaw, [-0.5, 0.5], prefersReduced ? [0, 0] : [-intensity, intensity]),
    springConfig
  );

  const glareX = useTransform(xRaw, [-0.5, 0.5], ["120%", "-20%"]);
  const glareY = useTransform(yRaw, [-0.5, 0.5], ["120%", "-20%"]);
  const glareOpacity = useSpring(
    useTransform(xRaw, [-0.5, 0, 0.5], prefersReduced ? [0, 0, 0] : [0.12, 0, 0.12]),
    springConfig
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    xRaw.set((e.clientX - rect.left) / rect.width - 0.5);
    yRaw.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    xRaw.set(0);
    yRaw.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      className={cn("relative", className)}
    >
      <div style={{ transform: "translateZ(0)" }}>{children}</div>

      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18), transparent 60%)`,
            opacity: glareOpacity,
          }}
        />
      )}
    </motion.div>
  );
}
