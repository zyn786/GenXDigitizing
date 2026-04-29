import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { updatePresenceForActor } from "@/lib/chat/repository";
import { presenceUpdateSchema } from "@/lib/chat/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);

    const body = await request.json();
    const parsed = presenceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid presence payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await updatePresenceForActor(actor, parsed.data);

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update presence.",
      },
      { status: 500 }
    );
  }
}