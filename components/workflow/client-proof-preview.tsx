"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  ImageIcon,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientProofPreviewProps {
  orderId: string;
}

interface ProofFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  previewUrl: string;
}

interface ProofFilesResponse {
  ok: boolean;
  files?: ProofFile[];
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientProofPreview({ orderId }: ClientProofPreviewProps) {
  const [files, setFiles] = useState<ProofFile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchIndex, setFetchIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/client/orders/${orderId}/proof-files`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        const json = (await res.json()) as ProofFilesResponse;
        if (cancelled) return;
        if (!res.ok || !json.ok || !Array.isArray(json.files)) {
          if (res.status === 403) {
            setError("Proof previews are only available to the order owner.");
          } else {
            setError(json.error ?? "Failed to load proof previews.");
          }
          setFiles(null);
        } else {
          setFiles(json.files);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Network error. Please try again.");
        setFiles(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, fetchIndex]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setFetchIndex((n) => n + 1);
  };

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <Skeleton className="h-48 w-full" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">
              Could not load proof previews
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            shape="pill"
            size="sm"
            onClick={handleRetry}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-7 w-7" />}
        title="No Proof Files Yet"
        description="Your proof preview will appear here once our team uploads it."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {files.map((file) => {
        const isImage = file.mimeType.toLowerCase().startsWith("image/");
        const isPdf = file.mimeType.toLowerCase() === "application/pdf";

        return (
          <Card key={file.id} className="overflow-hidden">
            <CardContent className="p-4">
              {isImage ? (
                <a
                  href={file.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.previewUrl}
                    alt={file.fileName}
                    className="max-h-64 w-full rounded-xl border border-border/60 bg-muted/40 object-contain"
                  />
                </a>
              ) : isPdf ? (
                <div className="flex h-48 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-10 w-10" />
                    <Badge variant="info">PDF</Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
                  <FileText className="h-10 w-10" />
                </div>
              )}

              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    title={file.fileName}
                  >
                    {file.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(file.sizeBytes)}
                  </p>
                </div>
                <Badge variant="success" className="shrink-0">
                  Proof Preview
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {isImage && (
                  <Button asChild variant="outline" shape="pill" size="sm">
                    <a
                      href={file.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Full Size
                    </a>
                  </Button>
                )}
                {isPdf && (
                  <Button asChild variant="outline" shape="pill" size="sm">
                    <a
                      href={file.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Preview
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
