import * as React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] border border-border/60 bg-card/40 px-6 py-16 text-center backdrop-blur-sm",
        className
      )}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.04), transparent)",
        }}
      />

      {icon && (
        <div className="relative mb-1 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-border/60 bg-muted/40 text-muted-foreground/60 shadow-inner">
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative">{icon}</div>
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
