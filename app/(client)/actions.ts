"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z
    .string()
    .max(30)
    .optional()
    .transform((v) => v?.trim() || null),
  companyName: z
    .string()
    .max(120)
    .optional()
    .transform((v) => v?.trim() || null),
  whatsapp: z
    .string()
    .max(30)
    .optional()
    .transform((v) => v?.trim() || null),
  address: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v?.trim() || null),
});

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof updateProfileSchema>, string[]>>;
};

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, phone, companyName, whatsapp, address } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user!.id },
        data: { name, phone: phone ?? undefined },
      });

      await tx.clientProfile.upsert({
        where: { userId: session.user!.id },
        update: { companyName, whatsapp, address },
        create: {
          userId: session.user!.id,
          companyName,
          whatsapp,
          address,
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unique constraint") && message.includes("phone")) {
      return { fieldErrors: { phone: ["That phone number is already in use."] } };
    }
    return { error: "Failed to save your profile. Please try again." };
  }

  return { success: true };
}
