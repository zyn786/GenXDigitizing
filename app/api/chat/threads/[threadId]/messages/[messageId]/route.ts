import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { editMessageForActor } from "@/lib/chat/repository";
import { editMessageInputSchema } from "@/lib/chat/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ threadId: string; messageId: string }> }
) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);
    const { messageId } = await context.params;

    const body = await request.json();
    const parsed = editMessageInputSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid message edit payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const message = await editMessageForActor(actor, messageId, parsed.data);

    return Response.json({ message });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to edit message.",
      },
      { status: 500 }
    );
  }
}