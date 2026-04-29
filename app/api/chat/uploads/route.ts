import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { attachmentUploadRequestSchema } from "@/lib/chat/schemas";
import { createChatAttachmentUploadIntent } from "@/lib/chat/uploads";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);

    const body = await request.json();
    const parsed = attachmentUploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid upload request.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const intent = await createChatAttachmentUploadIntent(actor, parsed.data);

    return Response.json(intent, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create upload intent.",
      },
      { status: 500 }
    );
  }
}