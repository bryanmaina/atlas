import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, verifyRoleValidationPermission } from "@/lib/auth";
import { generateSignatureHash } from "@/lib/crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action = "APPROVE", comments } = body;

    // 1. Authenticate user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required: No active user profile detected." },
        { status: 401 }
      );
    }

    // 2. Fetch target document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: true,
        signatures: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 3. Enforce Role-Based Validation Permissions
    const permission = verifyRoleValidationPermission(
      authUser.role,
      document.requiredValidationLevel
    );

    if (!permission.allowed) {
      console.warn(
        `[SECURITY ALERT] Unauthorized document validation attempt: User '${authUser.name}' (Role: ${authUser.role}) attempted to validate document '${document.title}' requiring '${document.requiredValidationLevel}'`
      );
      return NextResponse.json(
        {
          error: permission.reason,
          securityCode: "UNAUTHORIZED_DOCUMENT_APPROVAL",
          userRole: authUser.role,
          requiredLevel: document.requiredValidationLevel,
        },
        { status: 403 }
      );
    }

    if (action === "REJECT") {
      const updated = await prisma.document.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({
        success: true,
        action: "REJECTED",
        document: updated,
      });
    }

    // 4. Record cryptographic approval signature for the validator
    const timestamp = new Date().toISOString();
    const hash = generateSignatureHash({
      documentId: document.id,
      documentTitle: document.title,
      documentVersion: document.version,
      userId: authUser.id,
      userEmail: authUser.email,
      timestamp,
      statement: `Formally validated at ${document.requiredValidationLevel} by ${authUser.name} (${authUser.role}).`,
    });

    await prisma.signature.upsert({
      where: {
        documentId_userId: { documentId: document.id, userId: authUser.id },
      },
      update: {
        status: "SIGNED",
        validationLevel: document.requiredValidationLevel,
        signatureHash: hash,
        signedAt: new Date(timestamp),
        comments: comments || `Validated by ${authUser.role}`,
      },
      create: {
        documentId: document.id,
        userId: authUser.id,
        validationLevel: document.requiredValidationLevel,
        status: "SIGNED",
        signatureHash: hash,
        signedAt: new Date(timestamp),
        comments: comments || `Validated by ${authUser.role}`,
      },
    });

    // 5. Update document status to VALIDATED
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { status: "VALIDATED" },
      include: {
        author: true,
        signatures: { include: { user: true } },
      },
    });

    return NextResponse.json({
      success: true,
      action: "APPROVED",
      document: updatedDocument,
      validator: {
        id: authUser.id,
        name: authUser.name,
        role: authUser.role,
        skills: authUser.skills,
        validationLevel: document.requiredValidationLevel,
        signatureHash: hash,
      },
    });
  } catch (error) {
    console.error("Document validation route error:", error);
    return NextResponse.json(
      { error: "Failed to process document validation" },
      { status: 500 }
    );
  }
}
