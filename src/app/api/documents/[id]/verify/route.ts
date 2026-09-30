import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateSignatureHash } from "@/lib/crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: true,
        lastEditor: true,
        signatures: {
          where: { status: "SIGNED" },
          include: { user: true },
          orderBy: { signedAt: "asc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const distinctSignatures = document.signatures;
    const signedCount = distinctSignatures.length;
    const isVerified = document.status === "VERIFIED" || signedCount >= 2;

    const trafficLight: "RED" | "YELLOW" | "GREEN" =
      signedCount >= 2 ? "GREEN" : signedCount === 1 ? "YELLOW" : "RED";

    const hasActiveUserSigned = authUser
      ? distinctSignatures.some((s) => s.userId === authUser.id)
      : false;

    return NextResponse.json({
      documentId: document.id,
      title: document.title,
      status: document.status,
      version: document.version,
      requiredSignatures: 2,
      currentSignaturesCount: signedCount,
      trafficLight,
      isVerified,
      hasActiveUserSigned,
      lineage: {
        created: {
          user: document.author,
          timestamp: document.createdAt,
          version: 1,
          action: "Authored initial draft",
        },
        edited: document.lastEditor
          ? {
              user: document.lastEditor,
              timestamp: document.updatedAt,
              version: document.version,
              action: `Revised specifications (v${document.version})`,
            }
          : null,
        validated: distinctSignatures.map((sig, idx) => ({
          step: idx + 1,
          signatureId: sig.id,
          user: sig.user,
          signedAt: sig.signedAt,
          validationLevel: sig.validationLevel,
          signatureHash: sig.signatureHash,
          comments: sig.comments,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/documents/[id]/verify error:", err);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          error: "Authentication required to execute verification signature",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { comments = "Verified and signed.", statement = "I attest to the validity of this specification." } = body;

    // Fetch document and existing signed signatures
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: true,
        lastEditor: true,
        signatures: {
          where: { status: "SIGNED" },
          include: { user: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Prevent duplicate signing: Exactly two DISTINCT user signatures are required
    const existingUserSignature = document.signatures.find(
      (s) => s.userId === authUser.id
    );

    if (existingUserSignature) {
      return NextResponse.json(
        {
          error: `Duplicate signature prohibited: User '${authUser.name}' has already signed this document.`,
          code: "DUPLICATE_SIGNATURE_FORBIDDEN",
          message:
            "A single user cannot sign the same document twice. Exactly two distinct user signatures are required to verify this document.",
          existingSignatureId: existingUserSignature.id,
          signedAt: existingUserSignature.signedAt,
          userId: authUser.id,
          userName: authUser.name,
        },
        { status: 409 }
      );
    }

    // 2. Check if already fully verified
    if (document.signatures.length >= 2 || document.status === "VERIFIED") {
      return NextResponse.json(
        {
          error: "Document verification already complete.",
          code: "ALREADY_VERIFIED",
          message:
            "This document already has two distinct signatures and is in Verified status.",
        },
        { status: 400 }
      );
    }

    // 3. Generate cryptographic hash proof
    const signatureHash = generateSignatureHash({
      documentId: document.id,
      documentTitle: document.title,
      documentVersion: document.version,
      userId: authUser.id,
      userEmail: authUser.email,
      timestamp: new Date().toISOString(),
      statement,
    });

    const userValidationLevel =
      authUser.role === "ADMIN"
        ? "LEVEL_3"
        : authUser.role === "VALIDATOR"
        ? "LEVEL_2"
        : "LEVEL_1";

    // 4. Record the signature
    const signature = await prisma.signature.upsert({
      where: {
        documentId_userId: {
          documentId: document.id,
          userId: authUser.id,
        },
      },
      update: {
        status: "SIGNED",
        signatureHash,
        comments,
        signedAt: new Date(),
        validationLevel: userValidationLevel,
      },
      create: {
        documentId: document.id,
        userId: authUser.id,
        status: "SIGNED",
        signatureHash,
        comments,
        signedAt: new Date(),
        validationLevel: userValidationLevel,
      },
      include: {
        user: true,
      },
    });

    // 5. Query updated distinct signatures count
    const updatedSignatures = await prisma.signature.findMany({
      where: {
        documentId: document.id,
        status: "SIGNED",
      },
      include: { user: true },
      orderBy: { signedAt: "asc" },
    });

    const distinctCount = updatedSignatures.length;

    // 6. Transition status: exactly 2 distinct signatures change status from 'DRAFT' to 'VERIFIED'
    let updatedStatus = document.status;
    let finalDoc = document;

    if (distinctCount >= 2) {
      finalDoc = await prisma.document.update({
        where: { id: document.id },
        data: { status: "VERIFIED" },
        include: {
          author: true,
          lastEditor: true,
          signatures: {
            where: { status: "SIGNED" },
            include: { user: true },
          },
        },
      });
      updatedStatus = "VERIFIED";
    }

    const trafficLight: "RED" | "YELLOW" | "GREEN" =
      distinctCount >= 2 ? "GREEN" : distinctCount === 1 ? "YELLOW" : "RED";

    return NextResponse.json({
      success: true,
      message:
        distinctCount >= 2
          ? "Document successfully verified! Exactly two distinct user signatures recorded."
          : "First signature recorded. A second distinct user signature is required to complete verification.",
      distinctSignaturesCount: distinctCount,
      requiredSignatures: 2,
      trafficLight,
      isVerified: distinctCount >= 2,
      status: updatedStatus,
      document: finalDoc,
      newSignature: signature,
      lineage: {
        created: {
          user: finalDoc.author,
          timestamp: finalDoc.createdAt,
          version: 1,
          action: "Authored initial draft",
        },
        edited: finalDoc.lastEditor
          ? {
              user: finalDoc.lastEditor,
              timestamp: finalDoc.updatedAt,
              version: finalDoc.version,
              action: `Revised specifications (v${finalDoc.version})`,
            }
          : null,
        validated: updatedSignatures.map((sig, idx) => ({
          step: idx + 1,
          signatureId: sig.id,
          user: sig.user,
          signedAt: sig.signedAt,
          validationLevel: sig.validationLevel,
          signatureHash: sig.signatureHash,
          comments: sig.comments,
        })),
      },
    });
  } catch (err) {
    console.error("POST /api/documents/[id]/verify error:", err);
    return NextResponse.json(
      { error: "Failed to process verification signature" },
      { status: 500 }
    );
  }
}
