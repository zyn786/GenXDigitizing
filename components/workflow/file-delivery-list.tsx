import { Button } from "@/components/ui/button";
import type { DeliveryAsset } from "@/lib/workflow/types";

export function FileDeliveryList({ files }: { files: DeliveryAsset[] }) {
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div><p className="text-sm font-semibold">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{file.kind} · {file.format} · {file.sizeLabel}</p></div>
          <Button disabled={!file.ready} variant="outline" shape="pill" size="sm">{file.ready ? "Download" : "Pending"}</Button>
        </div>
      ))}
    </div>
  );
}
