import { CheckCircle, Circle, Clock, XCircle } from "lucide-react";
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

  return (
    <div className="grid gap-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-start gap-3">
          <div className="relative flex flex-col items-center">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full
              ${step.state === "done" ? "bg-emerald-500/20 text-emerald-400" :
                step.state === "active" ? "bg-amber-500/20 text-amber-400" :
                step.state === "skipped" ? "bg-red-500/20 text-red-400" :
                "bg-white/5 text-white/30"}`
            }>
              {step.state === "done" && <CheckCircle className="h-3.5 w-3.5" />}
              {step.state === "active" && <Clock className="h-3.5 w-3.5" />}
              {step.state === "skipped" && <XCircle className="h-3.5 w-3.5" />}
              {step.state === "pending" && <Circle className="h-3.5 w-3.5" />}
            </div>
            {i < steps.length - 1 && (
              <div className={`mt-1 h-4 w-px ${step.state === "done" ? "bg-emerald-500/30" : "bg-white/10"}`} />
            )}
          </div>
          <div className="pt-0.5">
            <span className={`text-xs font-medium
              ${step.state === "done" ? "text-foreground" :
                step.state === "active" ? "text-amber-300" :
                step.state === "skipped" ? "text-red-400/70" :
                "text-muted-foreground/60"}`
            }>
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
