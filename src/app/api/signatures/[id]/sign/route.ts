import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSignatureHash } from "@/lib/crypto";
import { getAuthenticatedUser, verifyRoleValidationPermission, verifySignatureOwnership } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { comments, statement = "I acknowledge and agree to comply with this policy document." } = body;

    // 1. Resolve active authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required: No active user profile detected." },
        { status: 401 }
      );
    }

    // 2. Lookup signature record with associated document and target user
    const signature = await prisma.signature.findUnique({
      where: { id },
      include: {
        document: true,
        user: true,
      },
    });

    if (!signature) {
      return NextResponse.json({ error: "Signature record not found" }, { status: 404 });
    }

    if (signature.status === "SIGNED") {
      return NextResponse.json(
        { error: "Document has already been signed by this user", signature },
        { status: 400 }
      );
    }

    // 3. Prevent Insecure Direct Object Reference (IDOR)
    const idorCheck = verifySignatureOwnership(authUser, signature.userId);
    if (!idorCheck.allowed) {
      console.warn(`[SECURITY ALERT] IDOR attempt blocked: User '${authUser.name}' tried to sign for '${signature.user.name}'`);
      return NextResponse.json(
        {
          error: idorCheck.reason,
          securityCode: "IDOR_VIOLATION_PREVENTED",
          attemptedBy: authUser.name,
          targetUser: signature.user.name,
        },
        { status: 403 }
      );
    }

    // 4. Enforce Role-Based Validation Level permissions
    const roleCheck = verifyRoleValidationPermission(authUser.role, signature.validationLevel);
    if (!roleCheck.allowed) {
      console.warn(`[SECURITY ALERT] Unauthorized approval attempt: User '${authUser.name}' with role '${authUser.role}' attempted '${signature.validationLevel}' validation`);
      return NextResponse.json(
        {
          error: roleCheck.reason,
          securityCode: "UNAUTHORIZED_ROLE_APPROVAL",
          userRole: authUser.role,
          requiredLevel: signature.validationLevel,
        },
        { status: 403 }
      );
    }

    // 5. Generate cryptographic SHA-256 digest
    const timestamp = new Date().toISOString();
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Atlas Client";

    const hash = generateSignatureHash({
      documentId: signature.documentId,
      documentTitle: signature.document.title,
      documentVersion: signature.document.version,
      userId: signature.userId,
      userEmail: signature.user.email,
      timestamp,
      statement,
    });

    // 6. Update signature record
    const updatedSignature = await prisma.signature.update({
      where: { id },
      data: {
        status: "SIGNED",
        signatureHash: hash,
        signedAt: new Date(timestamp),
        ipAddress,
        userAgent,
        comments: comments || null,
      },
      include: {
        document: true,
        user: true,
      },
    });

    // 7. Check if all document signatures are now satisfied to transition document to VALIDATED
    const remainingPending = await prisma.signature.count({
      where: {
        documentId: signature.documentId,
        status: "PENDING",
      },
    });

    if (remainingPending === 0) {
      await prisma.document.update({
        where: { id: signature.documentId },
        data: { status: "VALIDATED" },
      });
    }

    return NextResponse.json({
      success: true,
      signature: updatedSignature,
      receipt: {
        signatureHash: hash,
        algorithm: "SHA-256",
        timestamp,
        signatory: updatedSignature.user.name,
        signatoryRole: authUser.role,
        validationLevel: signature.validationLevel,
        document: updatedSignature.document.title,
        documentStatus: remainingPending === 0 ? "VALIDATED" : "IN_PROGRESS",
      },
    });
  } catch (error) {
    console.error("Failed to execute digital signature:", error);
    return NextResponse.json(
      { error: "Failed to record digital signature" },
      { status: 500 }
    );
  }
}
