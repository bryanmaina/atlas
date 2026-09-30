import { GoogleGenAI } from "@google/genai";

// Comprehensive enterprise & engineering skill taxonomy for fallback rule-based extraction
const TAXONOMY: Array<{ canonical: string; keywords: string[] }> = [
  // Cloud, Infra & DevOps
  { canonical: "Kubernetes", keywords: ["kubernetes", "k8s", "kubectl", "helm"] },
  { canonical: "Docker", keywords: ["docker", "container", "containers", "containerization", "dockerfile"] },
  { canonical: "Cloud Run", keywords: ["cloud run", "cloudrun", "google cloud run"] },
  { canonical: "Google Cloud Platform", keywords: ["google cloud", "gcp", "google cloud platform"] },
  { canonical: "AWS", keywords: ["aws", "amazon web services", "ec2", "s3", "lambda", "ecs"] },
  { canonical: "Azure", keywords: ["azure", "microsoft azure", "aks"] },
  { canonical: "Terraform", keywords: ["terraform", "iac", "infrastructure as code"] },
  { canonical: "CI/CD", keywords: ["ci/cd", "continuous integration", "github actions", "gitlab ci", "argocd", "jenkins"] },
  { canonical: "Microservices", keywords: ["microservices", "microservice", "service-oriented", "soa"] },
  { canonical: "Distributed Systems", keywords: ["distributed systems", "distributed architecture", "consensus", "raft", "fault-tolerant"] },
  { canonical: "DevOps", keywords: ["devops", "platform engineering", "sre", "site reliability"] },

  // Backend & Systems
  { canonical: "Go", keywords: ["golang", " go ", "go/", "go language", "gin", "goroutines"] },
  { canonical: "Python", keywords: ["python", "django", "fastapi", "flask", "pytorch"] },
  { canonical: "Node.js", keywords: ["node.js", "nodejs", "express", "fastify", "nest.js"] },
  { canonical: "Rust", keywords: ["rust", "cargo", "actix", "tokio"] },
  { canonical: "Java", keywords: ["java", "spring boot", "spring framework"] },
  { canonical: "C++", keywords: ["c++", "cpp", "systems programming"] },
  { canonical: "REST APIs", keywords: ["rest api", "rest apis", "restful", "http apis"] },
  { canonical: "GraphQL", keywords: ["graphql", "apollo", "schema stitching"] },
  { canonical: "gRPC", keywords: ["grpc", "protocol buffers", "protobuf"] },
  { canonical: "Event-Driven Architecture", keywords: ["event-driven", "pub/sub", "event sourcing", "eda", "message queues"] },

  // Frontend & Mobile
  { canonical: "Next.js", keywords: ["next.js", "nextjs", "next 15", "next 16", "app router"] },
  { canonical: "React", keywords: ["react", "react.js", "reactjs", "react 19", "react native"] },
  { canonical: "TypeScript", keywords: ["typescript", "ts", "type system"] },
  { canonical: "JavaScript", keywords: ["javascript", "es6", "ecmascript"] },
  { canonical: "Tailwind CSS", keywords: ["tailwind", "tailwindcss", "utility-first css"] },
  { canonical: "Frontend Performance", keywords: ["frontend performance", "web vitals", "lighthouse", "core web vitals", "lcp", "inp"] },
  { canonical: "Technical Documentation", keywords: ["technical documentation", "api documentation", "docs", "runbooks", "architecture notes"] },
  { canonical: "UI/UX Design", keywords: ["ui/ux", "user interface", "user experience", "wireframing", "design systems"] },

  // Databases & Storage
  { canonical: "PostgreSQL", keywords: ["postgresql", "postgres", "psql"] },
  { canonical: "SQLite", keywords: ["sqlite", "sqlite3"] },
  { canonical: "Prisma", keywords: ["prisma", "prisma orm", "prisma client"] },
  { canonical: "Redis", keywords: ["redis", "in-memory cache", "key-value store"] },
  { canonical: "Kafka", keywords: ["kafka", "apache kafka", "event stream"] },
  { canonical: "BigQuery", keywords: ["bigquery", "google bigquery", "data warehouse"] },
  { canonical: "Vector Databases", keywords: ["vector database", "vector search", "embeddings", "cosine similarity", "chromadb", "pinecone"] },

  // Security & Governance
  { canonical: "Cloud Architecture", keywords: ["cloud architecture", "system architect", "solution architect", "cloud solutions"] },
  { canonical: "Enterprise Governance", keywords: ["enterprise governance", "it governance", "corporate governance", "compliance policies"] },
  { canonical: "Risk Management", keywords: ["risk management", "risk assessment", "threat modeling", "risk mitigation"] },
  { canonical: "Security Auditing", keywords: ["security audit", "security auditing", "soc2", "soc 2", "iso 27001", "pci-dss", "vulnerability assessment"] },
  { canonical: "Security Review", keywords: ["security review", "code review", "code audit", "security review", "appsec"] },
  { canonical: "Executive Sign-off", keywords: ["executive sign-off", "executive signoff", "stakeholder sign-off", "c-level approval"] },
  { canonical: "Zero Trust", keywords: ["zero trust", "least privilege", "rbac", "abac", "iam", "identity access management"] },
  { canonical: "Cryptography", keywords: ["cryptography", "encryption", "aes-256", "sha-256", "tls", "digital signatures", "pki"] },
];

/**
 * Deterministic rule-based skill extraction from text.
 * Runs 100% offline with zero dependencies and no LLM latency.
 */
export function extractSkillsLocally(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  const normalized = " " + text.toLowerCase().replace(/[\r\n\t]/g, " ") + " ";
  const matched = new Set<string>();

  // 1. Scan against taxonomy
  for (const entry of TAXONOMY) {
    for (const kw of entry.keywords) {
      // Regex boundary check for clean word match
      const regex = new RegExp(`(?:^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`, "i");
      if (regex.test(normalized)) {
        matched.add(entry.canonical);
        break;
      }
    }
  }

  // 2. Scan for explicit pattern matches (e.g. "Proficient with X, Y, and Z", "Experienced in X")
  const experienceRegex = /(?:proficient in|experienced with|experience with|expertise in|skilled in|worked with|specialized in|knowledge of|responsible for)\s+([^.;\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = experienceRegex.exec(text)) !== null) {
    const rawList = match[1];
    const items = rawList.split(/,| and | & /i);
    for (const item of items) {
      const clean = item.trim().replace(/^[\s-•*]+/, "").replace(/[.;]+$/, "");
      if (clean.length > 2 && clean.length < 35 && !matched.has(clean)) {
        // Capitalize words
        const formatted = clean
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        if (formatted.length > 2 && !["The", "A", "And", "Or", "In", "With"].includes(formatted)) {
          matched.add(formatted);
        }
      }
    }
  }

  // If no taxonomy matches were found, fallback to capital noun phrases
  if (matched.size === 0) {
    const capitalizedTokens = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const stopWords = new Set(["The", "This", "I", "We", "My", "In", "With", "For", "To", "On", "At", "By", "From", "Our", "Project", "Team"]);
    for (const token of capitalizedTokens) {
      if (!stopWords.has(token) && token.length > 2 && token.length < 30) {
        matched.add(token);
      }
      if (matched.size >= 5) break;
    }
  }

  return Array.from(matched);
}

/**
 * Extracts core skills from an employee work description.
 * Utilizes lightweight Gemini API if available, gracefully falling back
 * to the deterministic local NLP extraction engine.
 */
export async function extractSkills(workDescription: string): Promise<{
  skills: string[];
  extractionMethod: "gemini-api" | "rule-based-nlp";
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a technical skills analyzer for Project Atlas.
Analyze the following employee work description or project history and extract 3 to 10 core technical and domain skills.
Return ONLY a comma-separated list of clean, standardized skill names (e.g. "Kubernetes, Go, Microservices, Cloud Run, Security Auditing").
Do not include numbering, bullets, explanation, or markdown formatting.

Work Description:
${workDescription}

Core Skills:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text && text.length > 0) {
        const rawSkills = text
          .split(/[,;\n]+/)
          .map((s) => s.replace(/^[\s-•*0-9.]+/, "").trim())
          .filter((s) => s.length > 1 && s.length < 40);

        if (rawSkills.length > 0) {
          // Deduplicate
          const unique = Array.from(new Set(rawSkills));
          return {
            skills: unique,
            extractionMethod: "gemini-api",
          };
        }
      }
    } catch (err) {
      console.warn("⚠️ Gemini Skill Extraction failed, falling back to local NLP extraction:", err);
    }
  }

  // Graceful deterministic fallback
  const localSkills = extractSkillsLocally(workDescription);
  return {
    skills: localSkills,
    extractionMethod: "rule-based-nlp",
  };
}
