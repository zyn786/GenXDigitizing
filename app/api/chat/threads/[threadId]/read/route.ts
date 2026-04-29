import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { markThreadReadForActor } from "@/lib/chat/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);
    const { threadId } = await context.params;

    const result = await markThreadReadForActor(actor, threadId);

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to mark thread read.",
      },
      { status: 500 }
    );
  }
}