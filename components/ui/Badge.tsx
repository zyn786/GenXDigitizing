// @ts-nocheck
import { cn } from "@/lib/utils";

interface BadgeProps {
  children:   React.ReactNode;
  className?: string;
  variant?:   "blue" | "orange" | "green" | "red" | "gray" | "purple" | "indigo" | "cyan" | "amber";
}

const variantClasses: Record<string, string> = {
  blue:   "bg-[#EFF3FF] text-[#1D4ED8] border-[rgba(37,99,235,0.22)]",
  orange: "bg-[#FFF7ED] text-[#C2410C] border-[rgba(249,115,22,0.22)]",
  green:  "bg-[#F0FDF4] text-[#15803D] border-[rgba(22,163,74,0.22)]",
  red:    "bg-[#FEF2F2] text-[#B91C1C] border-[rgba(220,38,38,0.22)]",
  gray:   "bg-[var(--elevated)] text-[var(--txt2)] border-[var(--border2)]",
  purple: "bg-[#EFF3FF] text-[#1D4ED8] border-[rgba(37,99,235,0.22)]",
  indigo: "bg-[#EFF3FF] text-[#1D4ED8] border-[rgba(37,99,235,0.22)]",
  cyan:   "bg-[#EFF3FF] text-[#1D4ED8] border-[rgba(37,99,235,0.22)]",
  amber:  "bg-[#FFF7ED] text-[#C2410C] border-[rgba(249,115,22,0.22)]",
};

export function Badge({ children, className, variant = "blue" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Domain-specific badges
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    submitted: "blue", assigned: "purple", in_progress: "amber",
    review: "indigo", approved: "cyan", delivered: "green",
    cancelled: "red", revision: "orange",
  };
  return <Badge variant={(map[status] ?? "gray") as any} className={className}>{status.replace(/_/g, " ")}</Badge>;
}

export function FreeBadge({ className }: { className?: string }) {
  return (
    <span className={cn("free-tag", className)}>FREE</span>
  );
}

// Domain-specific badge aliases
export function TierBadge(props: { children: React.ReactNode; className?: string }) {
  return <Badge variant="purple" {...props} />;
}
export function PayBadge(props: { children: React.ReactNode; className?: string }) {
  return <Badge variant="green" {...props} />;
}
export function PriorityBadge(props: { children: React.ReactNode; className?: string }) {
  return <Badge variant="orange" {...props} />;
}
export function LeadStageBadge(props: { children: React.ReactNode; className?: string }) {
  return <Badge variant="indigo" {...props} />;
}
export function TurnaroundBadge({ turnaround, className }: { turnaround: string; className?: string }) {
  const map: Record<string, "red" | "orange" | "green"> = { urgent: "red", rush: "orange", standard: "green" };
  return <Badge variant={map[turnaround] ?? "gray"} className={className}>{turnaround}</Badge>;
}
export function FormatBadge(props: { children: React.ReactNode; className?: string }) {
  return <Badge variant="cyan" {...props} />;
}
export function OrderNumBadge(props: { children: React.ReactNode; className?: string }) {
  return <Badge variant="blue" {...props} />;
}
