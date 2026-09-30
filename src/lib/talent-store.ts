import prisma from "./prisma";
import { getEmbedding, cosineSimilarity } from "./embeddings";

export interface UserSkillProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string;
  skillsList: string[];
  department: string | null;
  avatarUrl: string | null;
  profileVector: Float32Array;
  skillVectors: Array<{ skill: string; vector: Float32Array }>;
  updatedAt: Date;
}

export interface ExpertMatchResult {
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
    department: string | null;
    avatarUrl: string | null;
    skills: string;
    skillsList: string[];
  };
  score: number; // 0.0 - 1.0
  matchConfidence: number; // 0 - 100 percentage
  matchedSkills: string[];
  matchReasoning: string;
}

interface GlobalTalentState {
  isInitialized: boolean;
  lastLoaded: number;
  profiles: UserSkillProfile[];
}

const globalForTalent = globalThis as unknown as {
  __atlas_talent_store?: GlobalTalentState;
};

const talentState: GlobalTalentState = globalForTalent.__atlas_talent_store ?? {
  isInitialized: false,
  lastLoaded: 0,
  profiles: [],
};

if (process.env.NODE_ENV !== "production") {
  globalForTalent.__atlas_talent_store = talentState;
}

/**
 * Initializes and caches the in-memory vector store of User skills.
 */
export async function ensureTalentStoreReady(forceRefresh = false): Promise<number> {
  const ONE_HOUR = 60 * 60 * 1000;
  const isStale = Date.now() - talentState.lastLoaded > ONE_HOUR;

  if (talentState.isInitialized && talentState.profiles.length > 0 && !forceRefresh && !isStale) {
    return talentState.profiles.length;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        department: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    const profiles: UserSkillProfile[] = [];

    for (const u of users) {
      const skillsList = u.skills
        ? u.skills
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // Generate embedding for overall profile (name, role, department, skills)
      const profileText = `Name: ${u.name}. Role: ${u.role}. Department: ${u.department || ""}. Skills: ${u.skills}`;
      const profileVectorArray = await getEmbedding(profileText);

      // Generate individual skill embeddings
      const skillVectors: Array<{ skill: string; vector: Float32Array }> = [];
      for (const skill of skillsList) {
        const sVec = await getEmbedding(skill);
        skillVectors.push({
          skill,
          vector: new Float32Array(sVec),
        });
      }

      profiles.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        skills: u.skills,
        skillsList,
        department: u.department,
        avatarUrl: u.avatarUrl,
        profileVector: new Float32Array(profileVectorArray),
        skillVectors,
        updatedAt: u.updatedAt,
      });
    }

    talentState.profiles = profiles;
    talentState.isInitialized = true;
    talentState.lastLoaded = Date.now();

    return profiles.length;
  } catch (err) {
    console.error("Failed to build in-memory talent vector store:", err);
    return 0;
  }
}

/**
 * Searches the in-memory user database using vector similarity and token matching
 * to find the best matching experts for a given skill or capability query.
 */
export async function findMatchingExperts(
  query: string,
  options: {
    limit?: number;
    minConfidence?: number;
    roleFilter?: string;
  } = {}
): Promise<ExpertMatchResult[]> {
  const { limit = 10, minConfidence = 30, roleFilter } = options;

  if (!query || query.trim().length === 0) {
    return [];
  }

  await ensureTalentStoreReady();

  const queryVectorArray = await getEmbedding(query.trim());
  const queryVector = new Float32Array(queryVectorArray);
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = normalizedQuery.split(/[\s,+/]+/).filter((t) => t.length > 2);

  const results: ExpertMatchResult[] = [];

  for (const profile of talentState.profiles) {
    if (roleFilter && profile.role.toUpperCase() !== roleFilter.toUpperCase()) {
      continue;
    }

    // 1. Overall profile cosine similarity
    const profileSim = cosineSimilarity(queryVector, profile.profileVector);

    // 2. Individual skill cosine similarities & token matches
    let maxSkillSim = 0;
    const matchedSkillNames: string[] = [];
    let exactTokenOverlapCount = 0;

    for (const item of profile.skillVectors) {
      const sim = cosineSimilarity(queryVector, item.vector);
      const normalizedSkill = item.skill.toLowerCase();

      // Check direct token overlap
      const hasDirectOverlap = queryTokens.some(
        (token) => normalizedSkill.includes(token) || token.includes(normalizedSkill)
      );

      if (hasDirectOverlap) {
        exactTokenOverlapCount++;
      }

      if (sim > maxSkillSim) {
        maxSkillSim = sim;
      }

      // If semantic similarity is substantial or there's explicit keyword match
      if (sim >= 0.42 || hasDirectOverlap) {
        matchedSkillNames.push(item.skill);
      }
    }

    // 3. Compute blended score
    // Primary weight to best matching specific skill, supported by profile context
    const blendedBase = Math.max(maxSkillSim * 0.75 + profileSim * 0.25, profileSim * 0.9);
    
    // Add exact token overlap bonus (up to +0.20)
    const tokenBonus = Math.min(exactTokenOverlapCount * 0.1, 0.2);
    const combinedScore = Math.min(1.0, Math.max(0, blendedBase + tokenBonus));

    // Convert to percentage (30% - 99% scale for realistic visualization)
    let matchConfidence = Math.round(combinedScore * 100);
    if (matchConfidence > 99) matchConfidence = 99;
    if (matchConfidence < 0) matchConfidence = 0;

    // Filter by minimum threshold
    if (matchConfidence >= minConfidence) {
      // Formulate explanation reasoning
      let matchReasoning = "";
      if (matchedSkillNames.length > 0) {
        const topSkills = matchedSkillNames.slice(0, 3).join(", ");
        matchReasoning = `Strong verified competency in ${topSkills}.`;
      } else if (matchConfidence >= 60) {
        matchReasoning = `Semantic match based on role context (${profile.role}) and engineering background.`;
      } else {
        matchReasoning = `Adjacent technical capability in ${profile.department || "Engineering"}.`;
      }

      results.push({
        user: {
          id: profile.id,
          name: profile.name,
          role: profile.role,
          email: profile.email,
          department: profile.department,
          avatarUrl: profile.avatarUrl,
          skills: profile.skills,
          skillsList: profile.skillsList,
        },
        score: Math.round(combinedScore * 1000) / 1000,
        matchConfidence,
        matchedSkills: Array.from(new Set(matchedSkillNames)),
        matchReasoning,
      });
    }
  }

  // Sort descending by match confidence, then by raw score
  results.sort((a, b) => b.matchConfidence - a.matchConfidence || b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Resets / invalidates the in-memory talent cache when user skills are updated.
 */
export function invalidateTalentCache(): void {
  talentState.isInitialized = false;
  talentState.lastLoaded = 0;
  talentState.profiles = [];
}
