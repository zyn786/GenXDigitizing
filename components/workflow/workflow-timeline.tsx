import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteStatus, ProofStatus, OrderPaymentStatus } from "@/lib/workflow/types";

type TimelineStep = {
  key: string;
  label: string;
  state: "done" | "active" | "pending" | "skipped";
};

function buildSteps(
  orderStatus: string,
  quoteStatus: QuoteStatus | null,
  proofStatus: ProofStatus,
  paymentStatus: OrderPaymentStatus,
  filesUnlocked: boolean,
): TimelineStep[] {
  const isQuote = quoteStatus !== null;

  const steps: TimelineStep[] = [];

  if (isQuote) {
    steps.push({
      key: "quote_received",
      label: "Quote received",
      state: "done",
    });
    steps.push({
      key: "price_set",
      label: "Price set & sent",
      state: quoteStatus === "NEW" || quoteStatus === "UNDER_REVIEW"
        ? (quoteStatus === "UNDER_REVIEW" ? "active" : "pending")
        : "done",
    });
    steps.push({
      key: "quote_accepted",
      label: "Quote accepted",
      state: quoteStatus === "CLIENT_REJECTED"
        ? "skipped"
        : quoteStatus === "PRICE_SENT"
        ? "active"
        : ["CLIENT_ACCEPTED", "CONVERTED_TO_ORDER"].includes(quoteStatus)
        ? "done"
        : "pending",
    });
  }

  steps.push({
    key: "in_production",
    label: "In production",
    state: orderStatus === "SUBMITTED"
      ? "active"
      : ["IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED", "APPROVED", "DELIVERED", "CLOSED"].includes(orderStatus)
      ? "done"
      : "pending",
  });

  steps.push({
    key: "proof_sent",
    label: "Proof sent",
    state: ["NOT_UPLOADED", "UPLOADED", "INTERNAL_REVIEW"].includes(proofStatus)
      ? (orderStatus === "IN_PROGRESS" ? "active" : "pending")
      : "done",
  });

  steps.push({
    key: "proof_approved",
    label: "Proof approved",
    state: proofStatus === "SENT_TO_CLIENT" || proofStatus === "CLIENT_REVIEWING"
      ? "active"
      : proofStatus === "REVISION_REQUESTED"
      ? "pending"
      : proofStatus === "CLIENT_APPROVED"
      ? "done"
      : "pending",
  });

  steps.push({
    key: "payment",
    label: "Payment",
    state: paymentStatus === "NOT_REQUIRED" || proofStatus !== "CLIENT_APPROVED"
      ? "pending"
      : paymentStatus === "PAYMENT_PENDING"
      ? "active"
      : paymentStatus === "PAYMENT_SUBMITTED" || paymentStatus === "PAYMENT_UNDER_REVIEW"
      ? "active"
      : paymentStatus === "PAID"
      ? "done"
      : paymentStatus === "REJECTED"
      ? "pending"
      : "pending",
  });

  steps.push({
    key: "files_unlocked",
    label: "Files available",
    state: filesUnlocked || paymentStatus === "PAID" ? "done" : "pending",
  });

  return steps;
}

const STATE_CONFIG = {
  done: {
    icon: CheckCircle2,
    dot: "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30",
    connector: "bg-emerald-500/30",
    label: "text-foreground font-medium",
  },
  active: {
    icon: Clock,
    dot: "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30",
    connector: "bg-border/40",
    label: "text-amber-400 font-semibold",
  },
  skipped: {
    icon: XCircle,
    dot: "bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/25",
    connector: "bg-border/40",
    label: "text-red-500 dark:text-red-400/70 line-through",
  },
  pending: {
    icon: Circle,
    dot: "bg-muted/30 text-muted-foreground/40 border border-border/40",
    connector: "bg-border/30",
    label: "text-muted-foreground/50",
  },
};

export function WorkflowTimeline({
  orderStatus,
  quoteStatus,
  proofStatus,
  paymentStatus,
  filesUnlocked,
}: {
  orderStatus: string;
  quoteStatus: QuoteStatus | null;
  proofStatus: ProofStatus;
  paymentStatus: OrderPaymentStatus;
  filesUnlocked: boolean;
}) {
  const steps = buildSteps(orderStatus, quoteStatus, proofStatus, paymentStatus, filesUnlocked);
  const doneCount = steps.filter((s) => s.state === "done").length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground">
          {doneCount} of {steps.length} steps complete
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 min-w-[6rem] max-w-[8rem] flex-1 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-primary">{progress}%</span>
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-0.5">
        {steps.map((step, i) => {
          const config = STATE_CONFIG[step.state];
          const Icon = config.icon;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Left: icon + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    config.dot
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {!isLast && (
                  <div className={cn("mt-0.5 h-5 w-px rounded-full transition-colors duration-300", config.connector)} />
                )}
              </div>

              {/* Right: label */}
              <div className="pb-1 pt-0.5">
                <span className={cn("text-xs transition-colors duration-300", config.label)}>
                  {step.label}
                </span>
                {step.state === "active" && (
                  <div className="mt-0.5 text-[10px] text-amber-400/70">In progress</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
