import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isAppAdminRole } from "@/lib/auth/session";
import { createGetSignedUrl } from "@/lib/s3";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ fileId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAppAdminRole(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { fileId } = await params;
  const file = await prisma.clientReferenceFile.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  try {
    const downloadUrl = await createGetSignedUrl(file.bucket, file.objectKey, 300);
    return NextResponse.json({ ok: true, downloadUrl, fileName: file.fileName });
  } catch {
    return NextResponse.json({ error: "Failed to generate download link." }, { status: 500 });
  }
}
