import { Button } from "@/components/ui/button";
import { canApproveProof, canRequestRevision } from "@/lib/workflow/status";
import type { WorkflowOrder } from "@/lib/workflow/types";

export function ProofReviewCard({ order }: { order: WorkflowOrder }) {
  const latestProof = order.proofVersions[0] ?? null;
  return (
    <section className="rounded-2xl border border-border/60 bg-muted/30 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Proof review</p>
      {latestProof ? (
        <>
          <h2 className="mt-3 text-2xl font-semibold">{latestProof.versionLabel}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{latestProof.note}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{new Date(latestProof.createdAt).toLocaleString()}</p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted-foreground">No proof version has been uploaded yet.</p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={!canApproveProof(order.status)} variant="default" shape="pill">Approve proof</Button>
        <Button disabled={!canRequestRevision(order.status)} variant="outline" shape="pill">Request revision</Button>
      </div>
    </section>
  );
}
