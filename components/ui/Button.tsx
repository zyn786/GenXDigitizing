"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-xl",
    "text-sm font-medium transition-all duration-200",
    "cursor-pointer outline-none select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[0.97]",
    "border-none",
    "focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
  ].join(" "),
  {
    variants: {
      variant: {
        grad:    "text-white font-semibold shadow-sm bg-[#2563EB] hover:bg-[#1D4ED8] hover:-translate-y-px hover:shadow-md",
        cyan:    "text-white font-semibold shadow-sm bg-[#06B6D4] hover:bg-[#0891B2] hover:-translate-y-px hover:shadow-md",
        danger:  "text-white font-semibold shadow-sm bg-[#DC2626] hover:bg-[#B91C1C] hover:-translate-y-px hover:shadow-md",
        outline: "text-[#2563EB] bg-transparent border border-[#2563EB]/40 hover:bg-[#EFF3FF] hover:border-[#2563EB]/60",
        ghost2:  "text-[var(--txt3)] bg-transparent hover:text-[var(--txt)] hover:bg-[var(--border)]",
      },
      size: {
        xs:  "text-xs px-2.5 py-1 rounded-lg gap-1.5",
        sm:  "text-xs px-3 py-2 rounded-lg",
        md:  "text-sm px-4 py-2.5 rounded-xl",
        lg:  "text-base px-6 py-3 rounded-xl",
        xl:  "text-base px-8 py-4 rounded-2xl",
        icon:"w-9 h-9 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "grad",
      size:    "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?:   boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin flex-shrink-0" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
