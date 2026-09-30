import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { indexDocument, removeDocumentFromMemory } from "@/lib/vector-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            department: true,
          },
        },
        lastEditor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            department: true,
          },
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                department: true,
              },
            },
          },
          orderBy: { signedAt: "desc" },
        },
        _count: {
          select: {
            chunks: true,
            signatures: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const signedSignatures = document.signatures.filter((s) => s.status === "SIGNED");
    const signedCount = signedSignatures.length;
    const isVerified = document.status === "VERIFIED" || signedCount >= 2;
    const trafficLight: "RED" | "YELLOW" | "GREEN" =
      isVerified ? "GREEN" : signedCount === 1 ? "YELLOW" : "RED";

    return NextResponse.json({
      document: {
        ...document,
        verification: {
          trafficLight,
          signedCount,
          requiredSignatures: 2,
          isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Failed to retrieve document:", error);
    return NextResponse.json(
      { error: "Internal server error fetching document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, summary, category, tags, status, requiresSignoff } = body;

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(summary !== undefined && { summary }),
        ...(category && { category }),
        ...(tags !== undefined && { tags }),
        ...(status && { status }),
        ...(requiresSignoff !== undefined && { requiresSignoff: Boolean(requiresSignoff) }),
        version: existing.version + 1,
      },
      include: {
        author: true,
        signatures: {
          include: { user: true },
        },
      },
    });

    // Re-index into vector store & SQLite chunks
    await indexDocument(
      updated.id,
      updated.title,
      updated.content,
      updated.category,
      updated.status
    );

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.document.delete({
      where: { id },
    });

    removeDocumentFromMemory(id);

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
