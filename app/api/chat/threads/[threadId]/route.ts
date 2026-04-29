import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { getThreadDetailForActor } from "@/lib/chat/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);
    const { threadId } = await context.params;

    const thread = await getThreadDetailForActor(actor, threadId);

    if (!thread) {
      return Response.json({ error: "Thread not found." }, { status: 404 });
    }

    return Response.json({ thread });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to load thread.",
      },
      { status: 500 }
    );
  }
}