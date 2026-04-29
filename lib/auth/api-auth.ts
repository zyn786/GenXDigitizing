/**
 * API Route Authentication & Authorization Helpers
 *
 * These utilities ensure consistent auth checks across all API routes:
 * 1. Verify user is authenticated (has valid session)
 * 2. Verify user has required role(s)
 * 3. Verify user data access (e.g., own order vs. admin access)
 */

import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { isAppAdminRole, type AppRole } from "./session";

export interface AuthResponse {
  authorized: boolean;
  session: Session | null;
  error?: {
    message: string;
    status: 401 | 403;
  };
}

/**
 * Verify user is authenticated
 * Returns 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authorized: false,
      session: null,
      error: {
        message: "Unauthorized: No valid session",
        status: 401,
      },
    };
  }

  return { authorized: true, session };
}

/**
 * Verify user has admin role
 * Requires authentication first
 */
export async function requireAdminAuth(): Promise<AuthResponse> {
  const auth_result = await requireAuth();
  if (!auth_result.authorized || !auth_result.session) {
    return auth_result;
  }

  const userRole = auth_result.session.user?.role;
  if (!isAppAdminRole(userRole)) {
    return {
      authorized: false,
      session: auth_result.session,
      error: {
        message: "Forbidden: Admin access required",
        status: 403,
      },
    };
  }

  return auth_result;
}

/**
 * Verify user has one of specified roles
 * Requires authentication first
 */
export async function requireRoleAuth(
  allowedRoles: AppRole[]
): Promise<AuthResponse> {
  const auth_result = await requireAuth();
  if (!auth_result.authorized || !auth_result.session) {
    return auth_result;
  }

  const userRole = auth_result.session.user?.role as AppRole;
  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      session: auth_result.session,
      error: {
        message: `Forbidden: One of [${allowedRoles.join(", ")}] role required`,
        status: 403,
      },
    };
  }

  return auth_result;
}

/**
 * Verify user owns resource OR is admin
 * Useful for checking if user can access their own data
 */
export async function requireDataAccess(
  resourceOwnerId: string | null
): Promise<AuthResponse> {
  const auth_result = await requireAuth();
  if (!auth_result.authorized || !auth_result.session) {
    return auth_result;
  }

  const userId = auth_result.session.user?.id;
  const isAdmin = isAppAdminRole(auth_result.session.user?.role);

  // Allow if user is resource owner OR is admin
  if (userId !== resourceOwnerId && !isAdmin) {
    return {
      authorized: false,
      session: auth_result.session,
      error: {
        message: "Forbidden: You can only access your own resources",
        status: 403,
      },
    };
  }

  return auth_result;
}

/**
 * Return 401 or 403 error response
 */
export function authErrorResponse(error: AuthResponse["error"]) {
  if (!error) {
    return NextResponse.json(
      { ok: false, message: "Unknown error" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: false, message: error.message },
    { status: error.status }
  );
}

/**
 * Usage Example in API Route:
 *
 * ```ts
 * // app/api/admin/orders/[orderId]/route.ts
 *
 * export async function PATCH(request: Request, { params }: Props) {
 *   const authResult = await requireAdminAuth();
 *   if (!authResult.authorized) {
 *     return authErrorResponse(authResult.error);
 *   }
 *
 *   const session = authResult.session!;
 *   // ... rest of handler
 * }
 * ```
 *
 * Or for checking data access:
 *
 * ```ts
 * // app/api/client/invoices/[invoiceId]/route.ts
 *
 * export async function GET(request: Request, { params }: Props) {
 *   const authResult = await requireAuth();
 *   if (!authResult.authorized) {
 *     return authErrorResponse(authResult.error);
 *   }
 *
 *   const invoice = await prisma.invoice.findUnique({
 *     where: { id: params.invoiceId }
 *   });
 *
 *   // Verify user owns invoice
 *   const accessResult = await requireDataAccess(invoice?.clientUserId ?? null);
 *   if (!accessResult.authorized) {
 *     return authErrorResponse(accessResult.error);
 *   }
 *
 *   return NextResponse.json(invoice);
 * }
 * ```
 */
