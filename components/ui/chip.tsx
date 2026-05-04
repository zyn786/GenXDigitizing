import { cn } from "@/lib/utils";

type ChipVariant = "default" | "emerald" | "purple" | "blue" | "amber" | "red";

const variants: Record<ChipVariant, string> = {
  default: "border-border/60 bg-muted/60 text-muted-foreground",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  purple: "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  className?: string;
};

export function Chip({ label, variant = "default", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
