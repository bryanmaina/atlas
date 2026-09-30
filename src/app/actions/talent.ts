"use server";

import prisma from "@/lib/prisma";
import { extractSkills } from "@/lib/skill-extractor";
import {
  findMatchingExperts,
  invalidateTalentCache,
  ExpertMatchResult,
} from "@/lib/talent-store";

export interface SkillExtractionResult {
  success: boolean;
  skills: string[];
  extractionMethod: "gemini-api" | "rule-based-nlp";
  rawDescription: string;
  error?: string;
}

export interface ExpertSearchResult {
  success: boolean;
  query: string;
  count: number;
  experts: ExpertMatchResult[];
  error?: string;
}

export interface TalentAnalysisResult {
  success: boolean;
  extractedSkills: string[];
  extractionMethod: "gemini-api" | "rule-based-nlp";
  matchedExperts: ExpertMatchResult[];
  error?: string;
}

/**
 * Server Action: Extracts core skills from an employee's work description or project history.
 * Uses lightweight Gemini API or deterministic local NLP fallback.
 */
export async function extractSkillsAction(
  input: string | FormData
): Promise<SkillExtractionResult> {
  try {
    let workDescription = "";

    if (typeof input === "string") {
      workDescription = input.trim();
    } else if (input instanceof FormData) {
      workDescription = (input.get("workDescription") as string) || "";
    }

    if (!workDescription || workDescription.length < 5) {
      return {
        success: false,
        skills: [],
        extractionMethod: "rule-based-nlp",
        rawDescription: workDescription,
        error: "Work description must contain at least 5 characters.",
      };
    }

    const { skills, extractionMethod } = await extractSkills(workDescription);

    return {
      success: true,
      skills,
      extractionMethod,
      rawDescription: workDescription,
    };
  } catch (err) {
    console.error("extractSkillsAction error:", err);
    return {
      success: false,
      skills: [],
      extractionMethod: "rule-based-nlp",
      rawDescription: "",
      error: err instanceof Error ? err.message : "Failed to extract skills.",
    };
  }
}

/**
 * Server Action: Queries the in-memory User vector store to find matching experts
 * based on cosine similarity and semantic skill matching.
 */
export async function searchExpertsAction(
  query: string,
  options: {
    minConfidence?: number;
    limit?: number;
    roleFilter?: string;
  } = {}
): Promise<ExpertSearchResult> {
  try {
    const cleanedQuery = (query || "").trim();

    if (!cleanedQuery) {
      return {
        success: true,
        query: "",
        count: 0,
        experts: [],
      };
    }

    const experts = await findMatchingExperts(cleanedQuery, options);

    return {
      success: true,
      query: cleanedQuery,
      count: experts.length,
      experts,
    };
  } catch (err) {
    console.error("searchExpertsAction error:", err);
    return {
      success: false,
      query,
      count: 0,
      experts: [],
      error: err instanceof Error ? err.message : "Failed to search experts.",
    };
  }
}

/**
 * Server Action: Combines skill extraction and vector similarity matching in a single turn.
 * Takes a work description, extracts skills, and finds top matching peer experts.
 */
export async function extractAndMatchAction(
  workDescription: string
): Promise<TalentAnalysisResult> {
  try {
    const extractRes = await extractSkillsAction(workDescription);
    if (!extractRes.success || extractRes.skills.length === 0) {
      return {
        success: false,
        extractedSkills: [],
        extractionMethod: "rule-based-nlp",
        matchedExperts: [],
        error: extractRes.error || "No technical skills could be extracted.",
      };
    }

    // Query vector store using combined extracted skills
    const combinedSkillQuery = extractRes.skills.join(", ");
    const matchedExperts = await findMatchingExperts(combinedSkillQuery, {
      limit: 6,
      minConfidence: 35,
    });

    return {
      success: true,
      extractedSkills: extractRes.skills,
      extractionMethod: extractRes.extractionMethod,
      matchedExperts,
    };
  } catch (err) {
    console.error("extractAndMatchAction error:", err);
    return {
      success: false,
      extractedSkills: [],
      extractionMethod: "rule-based-nlp",
      matchedExperts: [],
      error: err instanceof Error ? err.message : "Talent analysis failed.",
    };
  }
}

/**
 * Server Action: Updates or appends skills for an employee in the database
 * and invalidates the in-memory talent cache.
 */
export async function assignSkillsToUserAction(
  userId: string,
  newSkills: string[]
): Promise<{ success: boolean; updatedSkills?: string; error?: string }> {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });

    if (!existing) {
      return { success: false, error: "User not found." };
    }

    const currentSkillsList = existing.skills
      ? existing.skills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const merged = Array.from(new Set([...currentSkillsList, ...newSkills]));
    const updatedSkills = merged.join(", ");

    await prisma.user.update({
      where: { id: userId },
      data: { skills: updatedSkills },
    });

    // Invalidate in-memory cache to force re-indexing
    invalidateTalentCache();

    return {
      success: true,
      updatedSkills,
    };
  } catch (err) {
    console.error("assignSkillsToUserAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update user skills.",
    };
  }
}
