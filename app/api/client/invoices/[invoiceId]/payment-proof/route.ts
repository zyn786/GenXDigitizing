import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { submitProofSchema } from "@/lib/payments/schemas";
import { submitPaymentProof, getClientPaymentProofs } from "@/lib/payments/repository";

type RouteProps = { params: Promise<{ invoiceId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ ok: false }, { status: 403 });

  const { invoiceId } = await params;
  const proofs = await getClientPaymentProofs(session.user.id, invoiceId);
  return NextResponse.json({ ok: true, proofs });
}

export async function POST(req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ ok: false }, { status: 403 });

  const { invoiceId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = submitProofSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const proof = await submitPaymentProof({
      invoiceId,
      clientUserId: session.user.id,
      paymentAccountId: parsed.data.paymentAccountId ?? null,
      proofImageKey: parsed.data.proofImageKey,
      proofImageBucket: parsed.data.proofImageBucket,
      amountClaimed: parsed.data.amountClaimed,
      clientNotes: parsed.data.clientNotes ?? null,
    });
    return NextResponse.json({ ok: true, proof }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    let status = 500;
    if (message === "Invoice not found.") status = 404;
    else if (message === "Forbidden.") status = 403;
    else if (message.startsWith("Payment proof can be submitted")) status = 400;
    else if (message.startsWith("Payment is not currently pending")) status = 400;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
