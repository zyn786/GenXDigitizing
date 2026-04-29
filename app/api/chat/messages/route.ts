import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { postMessageForActor } from "@/lib/chat/repository";
import { postMessageInputSchema } from "@/lib/chat/schemas";
import { z } from "zod";

const bodySchema = postMessageInputSchema.extend({
  threadId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid message payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { threadId, ...messageInput } = parsed.data;
    const message = await postMessageForActor(actor, threadId, messageInput);

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
