import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDownloadButton } from "@/components/client/client-download-button";
import { buildTitle } from "@/lib/site";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: buildTitle("My Files") };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ClientFilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/files");

  const orders = await prisma.workflowOrder.findMany({
    where: { clientUserId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      title: true,
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          filesUnlocked: true,
          status: true,
          proofSubmissions: {
            where: { status: "PENDING" },
            select: { id: true },
          },
        },
      },
      orderFiles: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ordersWithFiles = orders.filter((o) => o.orderFiles.length > 0);

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Client files
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Your delivered files
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Completed files from your orders appear here. Files are locked until your invoice
          payment is approved by our team.
        </p>
      </section>

      {ordersWithFiles.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No files delivered yet. Files will appear here once your designer uploads completed work.
        </div>
      ) : (
        <div className="grid gap-4">
          {ordersWithFiles.map((order) => {
            const filesUnlocked = order.invoice?.filesUnlocked ?? false;
            const hasPendingProof = (order.invoice?.proofSubmissions?.length ?? 0) > 0;

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{order.title}</CardTitle>
                      <CardDescription>Order #{order.orderNumber}</CardDescription>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      filesUnlocked
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {filesUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {!filesUnlocked && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                      {hasPendingProof
                        ? "Your payment proof is under review. Files will unlock once approved."
                        : order.invoice
                          ? (
                            <>
                              Files are locked.{" "}
                              <Link
                                href={`/client/invoices/${order.invoice.id}`}
                                className="underline underline-offset-2 hover:text-amber-300"
                              >
                                Submit payment proof
                              </Link>{" "}
                              to unlock your files.
                            </>
                          )
                          : "Files are locked pending invoice creation."}
                    </div>
                  )}

                  <div className="grid gap-2">
                    {order.orderFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{file.fileName}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {formatBytes(file.sizeBytes)} · {file.mimeType}
                          </div>
                        </div>
                        {filesUnlocked ? (
                          <ClientDownloadButton fileId={file.id} fileName={file.fileName} />
                        ) : (
                          <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                            Locked
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
