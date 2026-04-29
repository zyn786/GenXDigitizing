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

    return Response.json({ threads });
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