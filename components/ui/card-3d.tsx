"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Card3DProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
};

/** 2D pass-through — no 3D tilt, no spring physics, no glare. Kept for API compatibility. */
export function Card3D(props: Card3DProps) {
  return <div className={cn("relative", props.className)}>{props.children}</div>;
}
