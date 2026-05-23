"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  as?: "section" | "div";
}

const variants: Record<string, Variants> = {
  up:    { hidden: { opacity: 0, y: 40 },  visible: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -40 }, visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 40 },  visible: { opacity: 1, x: 0 } },
  none:  { hidden: { opacity: 0 },          visible: { opacity: 1 } },
};

export function AnimatedSection({
  children,
  className,
  id,
  delay = 0,
  direction = "up",
  as = "section",
}: AnimatedSectionProps) {
  const Component = motion[as] as typeof motion.section;

  return (
    <Component
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      variants={variants[direction]}
      className={className}
    >
      {children}
    </Component>
  );
}
