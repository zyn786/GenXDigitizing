import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { postMessageForActor } from "@/lib/chat/repository";
import { postMessageInputSchema } from "@/lib/chat/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);
    const { threadId } = await context.params;

    const body = await request.json();
    const parsed = postMessageInputSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid message payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const message = await postMessageForActor(actor, threadId, parsed.data);

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to post message.",
      },
      { status: 500 }
    );
  }
}