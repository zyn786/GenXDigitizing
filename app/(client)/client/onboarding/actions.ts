"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const companyName = String(formData.get("companyName") ?? "").trim() || null;
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  const contactMethod = String(formData.get("contactMethod") ?? "EMAIL").trim();
  const billingNotes = String(formData.get("billingNotes") ?? "").trim() || null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingComplete: true },
    }),
    prisma.clientProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        companyName,
        whatsapp,
        billingNotes,
      },
      update: {
        companyName: companyName ?? undefined,
        whatsapp: whatsapp ?? undefined,
        billingNotes: billingNotes ?? undefined,
      },
    }),
  ]);

  // contactMethod is stored for future use; currently captured but not persisted to schema
  void contactMethod;

  redirect("/client/dashboard");
}
