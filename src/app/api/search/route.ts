import { NextRequest, NextResponse } from "next/server";
import { searchSemanticKnowledge } from "@/lib/vector-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body?.query;
    const topK = typeof body?.topK === "number" ? body.topK : 6;
    const minScore = typeof body?.minScore === "number" ? body.minScore : 0.05;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ results: [], query: "" }, { status: 200 });
    }

    const results = await searchSemanticKnowledge(query.trim(), topK, minScore);

    return NextResponse.json({
      query: query.trim(),
      totalResults: results.length,
      results,
    });
  } catch (error) {
    console.error("Semantic search API error:", error);
    return NextResponse.json(
      { error: "Internal server error during semantic vector search" },
      { status: 500 }
    );
  }
}
