import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (documentId) where.documentId = documentId;
    if (userId) where.userId = userId;
    if (status && status !== "All") where.status = status;

    const signatures = await prisma.signature.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            category: true,
            version: true,
            status: true,
            requiredValidationLevel: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            skills: true,
            avatarUrl: true,
            department: true,
          },
        },
      },
    });

    const total = await prisma.signature.count();
    const signed = await prisma.signature.count({ where: { status: "SIGNED" } });
    const pending = await prisma.signature.count({ where: { status: "PENDING" } });
    const rate = total > 0 ? Math.round((signed / total) * 100) : 100;

    return NextResponse.json({
      signatures,
      metrics: {
        total,
        signed,
        pending,
        complianceRate: rate,
      },
    });
  } catch (error) {
    console.error("Failed to fetch signatures:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature audit records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, userId } = body;

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: "documentId and userId are required" },
        { status: 400 }
      );
    }

    const signature = await prisma.signature.upsert({
      where: {
        documentId_userId: { documentId, userId },
      },
      update: {
        status: "PENDING",
        signedAt: null,
        signatureHash: null,
      },
      create: {
        documentId,
        userId,
        status: "PENDING",
      },
      include: {
        document: true,
        user: true,
      },
    });

    return NextResponse.json({ signature }, { status: 201 });
  } catch (error) {
    console.error("Failed to request signature:", error);
    return NextResponse.json(
      { error: "Failed to request signature" },
      { status: 500 }
    );
  }
}
