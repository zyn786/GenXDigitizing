import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";

type Props = { params: Promise<{ itemId: string }> };

const addSchema = z.object({
  objectKey: z.string().min(1),
  altText: z.string().max(200).optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { itemId } = await params;
  const item = await prisma.portfolioItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  const count = await prisma.portfolioImage.count({ where: { portfolioItemId: itemId } });
  if (count >= 5) {
    return NextResponse.json({ ok: false, message: "Maximum 5 images per item." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Invalid data." }, { status: 400 });

  const image = await prisma.portfolioImage.create({
    data: {
      portfolioItemId: itemId,
      objectKey: parsed.data.objectKey,
      altText: parsed.data.altText ?? null,
      sortOrder: parsed.data.sortOrder ?? count,
    },
  });

  return NextResponse.json({ ok: true, image }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { itemId } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ ok: false, message: "imageId required." }, { status: 400 });

  const image = await prisma.portfolioImage.findFirst({
    where: { id: imageId, portfolioItemId: itemId },
  });
  if (!image) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  await prisma.portfolioImage.delete({ where: { id: imageId } });

  return NextResponse.json({ ok: true });
}
