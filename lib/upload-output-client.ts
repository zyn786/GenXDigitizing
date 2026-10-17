/**
 * Sequential output uploader for the designer portal.
 *
 * The old flow put every selected file into one multipart request. Vercel
 * rejects request bodies over 4.5MB before the route runs, so a normal batch
 * of ten stitch files failed with a bare "Upload failed". Each file now gets
 * its own request (notify=0), and a final finalize=1 call performs the status
 * change and admin notification once.
 */

export type OutputUpload = { file: File; format: string };

/** Vercel rejects request bodies above 4.5MB before the route runs. */
const MAX_REQUEST_FILE_BYTES = 4 * 1024 * 1024;

export async function uploadOutputFiles(
  orderId: string,
  files: OutputUpload[],
  opts?: {
    signal?: AbortSignal;
    onProgress?: (done: number, total: number) => void;
  }
): Promise<void> {
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    if (opts?.signal?.aborted) throw new Error("Upload cancelled");

    const file = files[i].file;
    if (file.size > MAX_REQUEST_FILE_BYTES) {
      throw new Error(
        `"${file.name}" is ${(file.size / 1048576).toFixed(1)}MB — the per-file limit is 4MB.`
      );
    }

    const fd = new FormData();
    fd.append("orderId", orderId);
    fd.append("files", file);
    fd.append("formats", files[i].format);
    fd.append("notify", "0");

    const res = await fetch("/api/upload/output", {
      method: "POST",
      body: fd,
      signal: opts?.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body.error || `Upload failed for "${files[i].file.name}" (${res.status})`
      );
    }

    opts?.onProgress?.(i + 1, total);
  }

  // One finalize request: move the order to QA and notify admins once.
  const fd = new FormData();
  fd.append("orderId", orderId);
  fd.append("finalize", "1");
  const res = await fetch("/api/upload/output", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || "Files uploaded, but the QA submission could not be completed"
    );
  }
}
