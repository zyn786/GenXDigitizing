import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { createThreadInputSchema, listThreadsQuerySchema } from "@/lib/chat/schemas";
import {
  createOrGetThreadForActor,
  listThreadsForActor,
} from "@/lib/chat/repository";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);

    const url = new URL(request.url);
    const parsed = listThreadsQuerySchema.safeParse({
      type: url.searchParams.get("type") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid thread query.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const threads = await listThreadsForActor(actor, parsed.data);

    // Find latest modification time for conditional fetch
    let latestMod = 0;
    for (const t of threads) {
      const ts = t.lastMessageAt ? new Date(t.lastMessageAt).getTime() : new Date(t.updatedAt).getTime();
      if (ts > latestMod) latestMod = ts;
    }
    const lastModified = latestMod > 0 ? new Date(latestMod).toUTCString() : null;

    // Check If-Modified-Since
    const ifModSince = request.headers.get("If-Modified-Since");
    if (ifModSince && lastModified) {
      const clientTime = new Date(ifModSince).getTime();
      if (clientTime >= latestMod) {
        return new Response(null, {
          status: 304,
          headers: lastModified ? { "Last-Modified": lastModified } : {},
        });
      }
    }

    return Response.json(
      { threads },
      lastModified ? { headers: { "Last-Modified": lastModified } } : {},
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to list chat threads.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);

    const body = await request.json();
    const parsed = createThreadInputSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid thread payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const thread = await createOrGetThreadForActor(actor, parsed.data);

    return Response.json({ thread }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to create chat thread.",
      },
      { status: 500 }
    );
  }
}