import { NextRequest, NextResponse } from "next/server";
import { findMatchingExperts } from "@/lib/talent-store";
import { extractSkills } from "@/lib/skill-extractor";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skill = searchParams.get("skill") || searchParams.get("q") || "";
    const minConfidence = parseInt(searchParams.get("minConfidence") || "30", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const role = searchParams.get("role") || undefined;

    if (!skill.trim()) {
      return NextResponse.json({
        experts: [],
        count: 0,
        query: "",
      });
    }

    const experts = await findMatchingExperts(skill, {
      minConfidence,
      limit,
      roleFilter: role,
    });

    return NextResponse.json({
      experts,
      count: experts.length,
      query: skill,
    });
  } catch (err) {
    console.error("GET /api/talent error:", err);
    return NextResponse.json(
      { error: "Failed to query expert talent map" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workDescription, autoMatch = true } = body;

    if (!workDescription || typeof workDescription !== "string") {
      return NextResponse.json(
        { error: "workDescription string is required" },
        { status: 400 }
      );
    }

    const { skills, extractionMethod } = await extractSkills(workDescription);

    let experts: unknown[] = [];
    if (autoMatch && skills.length > 0) {
      experts = await findMatchingExperts(skills.join(", "), {
        limit: 6,
        minConfidence: 35,
      });
    }

    return NextResponse.json({
      skills,
      extractionMethod,
      experts,
    });
  } catch (err) {
    console.error("POST /api/talent error:", err);
    return NextResponse.json(
      { error: "Failed to process work description" },
      { status: 500 }
    );
  }
}
