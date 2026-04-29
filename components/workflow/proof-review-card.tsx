import { canApproveProof, canRequestRevision } from "@/lib/workflow/status";
import type { WorkflowOrder } from "@/lib/workflow/types";

export function ProofReviewCard({ order }: { order: WorkflowOrder }) {
  const latestProof = order.proofVersions[0] ?? null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-[0.22em] text-white/45">
        Proof review
      </div>

      {latestProof ? (
        <>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {latestProof.versionLabel}
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/65">{latestProof.note}</p>
          <div className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">
            {new Date(latestProof.createdAt).toLocaleString()}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-7 text-white/65">
          No proof version has been uploaded yet.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canApproveProof(order.status)}
          className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve proof
        </button>
        <button
          type="button"
          disabled={!canRequestRevision(order.status)}
          className="inline-flex h-11 items-center rounded-full border border-white/10 bg-white/[0.08] px-5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Request revision
        </button>
      </div>
    </section>
  );
}
