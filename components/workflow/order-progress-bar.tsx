import { cn } from "@/lib/utils";

interface OrderProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function OrderProgressBar({ value, className, showLabel = false }: OrderProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const colorClass =
    clamped === 100
      ? "from-emerald-500 to-teal-500"
      : clamped >= 70
      ? "from-violet-500 to-indigo-500"
      : clamped >= 40
      ? "from-amber-500 to-orange-500"
      : "from-blue-500 to-indigo-500";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
        {/* Track shimmer */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted/0 via-muted-foreground/5 to-muted/0" />
        {/* Fill bar */}
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[2.5rem] text-right text-xs font-semibold text-muted-foreground">
          {clamped}%
        </span>
      )}
    </div>
  );
}
