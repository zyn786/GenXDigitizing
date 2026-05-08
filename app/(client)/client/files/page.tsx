import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderOpen, Lock } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileShareActions } from "@/components/client/file-share-actions";
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
        where: { fileType: "FINAL_FILE" },
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
        <p className="section-eyebrow">Client files</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Your Files</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Completed files from your orders appear here. Files are locked until your invoice payment is approved.
        </p>
      </section>

      {ordersWithFiles.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-8 w-8" />}
          title="No files yet"
          description="Files will appear here once your designer uploads completed work and payment is approved."
        />
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
                    <Badge className={filesUnlocked ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"}>
                      {filesUnlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {!filesUnlocked && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>
                        {hasPendingProof
                          ? "Your payment proof is under review. Files will unlock once approved."
                          : order.invoice
                            ? (
                              <>
                                Files are locked.{" "}
                                <Link
                                  href={`/client/invoices/${order.invoice.id}`}
                                  className="underline underline-offset-2 hover:text-foreground"
                                >
                                  Submit payment proof
                                </Link>{" "}
                                to unlock your files.
                              </>
                            )
                            : "Your invoice is being prepared. We'll notify you once it's ready for payment."}
                      </span>
                    </div>
                  )}

                  <div className="grid gap-2">
                    {order.orderFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.fileName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatBytes(file.sizeBytes)} · {file.mimeType}
                          </p>
                        </div>
                        {filesUnlocked ? (
                          <FileShareActions fileId={file.id} fileName={file.fileName} mimeType={file.mimeType} />
                        ) : (
                          <Badge>Locked</Badge>
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
