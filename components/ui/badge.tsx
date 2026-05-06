import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-white/10 text-foreground/80",
        primary:
          "border-primary/25 bg-primary/15 text-primary",
        success:
          "border-emerald-500/25 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-amber-500/25 bg-amber-500/15 text-amber-600 dark:text-amber-400",
        danger:
          "border-red-500/25 bg-red-500/15 text-red-600 dark:text-red-400",
        info:
          "border-blue-500/25 bg-blue-500/15 text-blue-600 dark:text-blue-400",
        violet:
          "border-violet-500/25 bg-violet-500/15 text-violet-600 dark:text-violet-400",
        gold:
          "border-amber-400/30 bg-amber-400/15 text-amber-500 dark:text-amber-300",
        muted:
          "border-border/60 bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
