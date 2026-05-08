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

    // Compute latest modification time across thread + all messages
    let latestMod = new Date(thread.thread.updatedAt).getTime();
    if (thread.thread.lastMessageAt) {
      const lm = new Date(thread.thread.lastMessageAt).getTime();
      if (lm > latestMod) latestMod = lm;
    }
    for (const m of thread.messages) {
      const mt = new Date(m.updatedAt).getTime();
      if (mt > latestMod) latestMod = mt;
    }
    const lastModified = new Date(latestMod).toUTCString();

    // Check If-Modified-Since
    const ifModSince = _request.headers.get("If-Modified-Since");
    if (ifModSince) {
      const clientTime = new Date(ifModSince).getTime();
      if (clientTime >= latestMod) {
        return new Response(null, {
          status: 304,
          headers: { "Last-Modified": lastModified },
        });
      }
    }

    return Response.json(
      { thread },
      { headers: { "Last-Modified": lastModified } },
    );
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