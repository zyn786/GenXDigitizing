import { cn } from "@/lib/utils";
import type {
  OrderStatus, ClientTier, PayStatus,
  Priority, LeadStage, Turnaround
} from "@/types";
import {
  STATUS_LABEL, STATUS_CLASS, TIER_CLASS,
  PAY_CLASS, PRIORITY_CLASS, LEAD_STAGE_CLASS,
  TURNAROUND_OPTIONS,
} from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, className, style }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full",
        "text-[11px] font-medium border",
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function TierBadge({ tier }: { tier: ClientTier }) {
  const labels: Record<ClientTier, string> = {
    vip:    "👑 VIP",
    active: "✓ Active",
    new:    "New",
  };
  return (
    <Badge className={TIER_CLASS[tier]}>
      {labels[tier]}
    </Badge>
  );
}

export function PayBadge({ status }: { status: PayStatus }) {
  const labels: Record<PayStatus, string> = {
    paid:     "Paid",
    pending:  "Pending",
    refunded: "Refunded",
    failed:   "Failed",
  };
  return (
    <Badge className={PAY_CLASS[status]}>
      {labels[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={PRIORITY_CLASS[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return (
    <Badge className={LEAD_STAGE_CLASS[stage]}>
      {stage.replace("_", " ")}
    </Badge>
  );
}

export function TurnaroundBadge({ turnaround }: { turnaround: Turnaround }) {
  const t = TURNAROUND_OPTIONS[turnaround];
  return (
    <Badge
      className="border"
      style={{
        background: `${t.color}18`,
        color: t.color,
        borderColor: `${t.color}44`,
      }}
    >
      {t.icon} {t.label}
    </Badge>
  );
}

export function FreeBadge({ label = "FREE" }: { label?: string }) {
  return (
    <span className="free-tag">
      {label}
    </span>
  );
}

// Monochrome format badge (DST, PES, etc.)
export function FormatBadge({ format }: { format: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] px-2 py-0.5 rounded",
        "bg-[var(--border)] text-[var(--txt2)] border border-[var(--border2)]"
      )}
    >
      {format}
    </span>
  );
}

// Gradient order number badge
export function OrderNumBadge({ orderNumber }: { orderNumber: string }) {
  return (
    <span
      className="font-mono text-[12px] font-bold"
      style={{
        background: "linear-gradient(90deg,#A855F7,#22D3EE)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {orderNumber}
    </span>
  );
}
