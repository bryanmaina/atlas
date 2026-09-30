import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { indexDocument } from "@/lib/vector-store";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const requiresSignoff = searchParams.get("requiresSignoff");

    const where: Record<string, unknown> = {};
    if (category && category !== "All") {
      where.category = category;
    }
    if (status && status !== "All") {
      where.status = status;
    }
    if (requiresSignoff !== null && requiresSignoff !== undefined) {
      where.requiresSignoff = requiresSignoff === "true";
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        lastEditor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        signatures: {
          select: {
            id: true,
            status: true,
            signedAt: true,
            userId: true,
          },
        },
        _count: {
          select: {
            chunks: true,
            signatures: true,
          },
        },
      },
    });

    const enrichedDocs = documents.map((doc) => {
      const signedCount = doc.signatures.filter((s) => s.status === "SIGNED").length;
      const isVerified = doc.status === "VERIFIED" || signedCount >= 2;
      const trafficLight: "RED" | "YELLOW" | "GREEN" =
        isVerified ? "GREEN" : signedCount === 1 ? "YELLOW" : "RED";

      return {
        ...doc,
        verification: {
          trafficLight,
          signedCount,
          requiredSignatures: 2,
          isVerified,
        },
      };
    });

    return NextResponse.json({ documents: enrichedDocs });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizational documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      authorId,
      summary,
      category = "General",
      tags,
      requiresSignoff = false,
      requiredValidationLevel = "LEVEL_1",
    } = body;

    const authUser = await getAuthenticatedUser(request);
    const finalAuthorId = authorId || authUser?.id;

    if (!title || !content || !finalAuthorId) {
      return NextResponse.json(
        { error: "Title, content, and valid author are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const document = await prisma.document.create({
      data: {
        title,
        slug,
        content,
        summary: summary || content.slice(0, 180) + "...",
        category,
        tags,
        requiresSignoff: Boolean(requiresSignoff),
        requiredValidationLevel,
        status: requiresSignoff ? "PENDING_VALIDATION" : "PUBLISHED",
        authorId: finalAuthorId,
      },
      include: {
        author: true,
      },
    });

    // Automatically index new document in in-memory vector store & SQLite chunks
    await indexDocument(
      document.id,
      document.title,
      document.content,
      document.category,
      document.status
    );

    // If requires sign-off, automatically create pending signature requests for users
    if (requiresSignoff) {
      const allUsers = await prisma.user.findMany();
      for (const u of allUsers) {
        await prisma.signature.create({
          data: {
            documentId: document.id,
            userId: u.id,
            validationLevel: requiredValidationLevel,
            status: "PENDING",
          },
        });
      }
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
