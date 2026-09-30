import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import type { User } from "@prisma/client";

export const VALIDATION_LEVELS = {
  LEVEL_1: {
    name: "LEVEL_1",
    label: "Peer Review",
    allowedRoles: ["ADMIN", "VALIDATOR", "CONTRIBUTOR"],
    description: "Standard peer review and procedural acknowledgment.",
  },
  LEVEL_2: {
    name: "LEVEL_2",
    label: "Technical Validation",
    allowedRoles: ["ADMIN", "VALIDATOR"],
    description: "In-depth technical architecture and security validation.",
  },
  LEVEL_3: {
    name: "LEVEL_3",
    label: "Executive Authorization",
    allowedRoles: ["ADMIN"],
    description: "Executive compliance, legal, and company-wide regulatory authorization.",
  },
} as const;

export type ValidationLevelKey = keyof typeof VALIDATION_LEVELS;

/**
 * Resolves the authenticated user from request headers or cookies.
 * Fallback to default user if no header is present (for simple browser queries).
 */
export async function getAuthenticatedUser(request: Request | NextRequest): Promise<User | null> {
  let userId: string | null = null;

  // 1. Check custom header (passed by client fetch wrapper)
  const headerUserId = request.headers.get("x-atlas-user-id");
  if (headerUserId) {
    userId = headerUserId;
  }

  // 2. Check cookie if available
  if (!userId && "cookies" in request) {
    // NextRequest
    const cookie = (request as NextRequest).cookies.get("atlas-active-user");
    if (cookie?.value) {
      userId = cookie.value;
    }
  }

  if (!userId) {
    // If no explicit user passed, attempt to retrieve the first default user as fallback
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });
    return firstUser;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

/**
 * Enforces role-based permissions against a target validation level.
 * Prevents unauthorized approvals.
 */
export function verifyRoleValidationPermission(
  userRole: string,
  requiredLevel: string
): { allowed: boolean; reason?: string } {
  const levelKey = (requiredLevel.toUpperCase() as ValidationLevelKey) || "LEVEL_1";
  const levelDef = VALIDATION_LEVELS[levelKey];

  if (!levelDef) {
    return {
      allowed: false,
      reason: `Unknown validation level '${requiredLevel}'.`,
    };
  }

  const allowedRoles: readonly string[] = levelDef.allowedRoles;
  if (!allowedRoles.includes(userRole.toUpperCase())) {
    return {
      allowed: false,
      reason: `Unauthorized: User role '${userRole}' lacks permission for '${levelDef.name}' (${levelDef.label}). Required roles: ${allowedRoles.join(
        ", "
      )}.`,
    };
  }

  return { allowed: true };
}

/**
 * Protects against Insecure Direct Object Reference (IDOR) on signature records.
 * A non-admin user can only execute signatures assigned specifically to their userId.
 */
export function verifySignatureOwnership(
  authenticatedUser: User,
  targetSignatureUserId: string
): { allowed: boolean; isIdorViolation: boolean; reason?: string } {
  // If user is ADMIN, they may manage or override validation workflows
  if (authenticatedUser.role.toUpperCase() === "ADMIN") {
    return { allowed: true, isIdorViolation: false };
  }

  // Otherwise, user must match signature's assigned userId
  if (authenticatedUser.id !== targetSignatureUserId) {
    return {
      allowed: false,
      isIdorViolation: true,
      reason: `IDOR Security Violation: User '${authenticatedUser.name}' (${authenticatedUser.id}) cannot execute or modify signatures assigned to user '${targetSignatureUserId}'.`,
    };
  }

  return { allowed: true, isIdorViolation: false };
}
