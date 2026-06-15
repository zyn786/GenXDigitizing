/**
 * Safe error response — never leaks raw DB/API error messages to client.
 * Use instead of: return NextResponse.json({ error: error.message }, ...)
 */
export function safeError(err: unknown, fallback = "Internal server error"): string {
  if (process.env.NODE_ENV === "development") {
    return err instanceof Error ? err.message : String(err);
  }
  return fallback;
}

export function safeErrorResponse(err: unknown, status = 500, fallback = "Internal server error") {
  const message = safeError(err, fallback);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require("next/server");
  return NextResponse.json({ error: message }, { status });
}
