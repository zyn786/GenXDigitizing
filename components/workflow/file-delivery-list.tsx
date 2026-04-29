import type { DeliveryAsset } from "@/lib/workflow/types";

export function FileDeliveryList({ files }: { files: DeliveryAsset[] }) {
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4"
        >
          <div>
            <div className="text-sm font-semibold text-white">{file.name}</div>
            <div className="mt-1 text-sm text-white/60">
              {file.kind} · {file.format} · {file.sizeLabel}
            </div>
          </div>

          <button
            type="button"
            disabled={!file.ready}
            className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.08] px-4 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {file.ready ? "Download" : "Pending"}
          </button>
        </div>
      ))}
    </div>
  );
}
