import { GoogleGenAI } from "@google/genai";

const EMBEDDING_DIMENSION = 256;

/**
 * Deterministic local dense vector embedding generator.
 * Produces unit-normalized dense vectors based on subword n-grams, word stems,
 * and positional frequency hashing. Ensures 100% offline standalone functionality.
 */
function generateLocalEmbedding(text: string): number[] {
  const vector = new Float32Array(EMBEDDING_DIMENSION);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return Array.from(vector);
  }

  // Weight word tokens and character 3-grams
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const weight = 1.0 + Math.min(word.length / 5, 1.5);

    // Hash the whole word
    let hash = 5381;
    for (let c = 0; c < word.length; c++) {
      hash = ((hash << 5) + hash + word.charCodeAt(c)) & 0x7fffffff;
    }
    const idx = hash % EMBEDDING_DIMENSION;
    vector[idx] += weight;

    // Hash 3-character n-grams for typo-resilient semantic similarity
    for (let j = 0; j <= word.length - 3; j++) {
      const ngram = word.substring(j, j + 3);
      let ngramHash = 33;
      for (let c = 0; c < ngram.length; c++) {
        ngramHash = ((ngramHash << 5) + ngramHash + ngram.charCodeAt(c)) & 0x7fffffff;
      }
      const ngramIdx = ngramHash % EMBEDDING_DIMENSION;
      vector[ngramIdx] += 0.45;
    }
  }

  // Compute L2 Euclidean norm and normalize to unit hypersphere
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-9;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    vector[i] /= norm;
  }

  return Array.from(vector);
}

/**
 * Main embedding generator. Uses Google Gemini text-embedding-004 if GEMINI_API_KEY
 * is provided, falling back to local deterministic dense vectors.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      });

      const values = response.embeddings?.[0]?.values;
      if (values && values.length > 0) {
        // Normalize vector to unit length
        let sumSq = 0;
        for (const v of values) sumSq += v * v;
        const norm = Math.sqrt(sumSq) || 1e-9;
        return values.map((v: number) => v / norm);
      }
    } catch (err) {
      console.warn("⚠️ Gemini Embedding failed, utilizing deterministic local fallback:", err);
    }
  }

  return generateLocalEmbedding(text);
}

/**
 * Computes cosine similarity between two unit-normalized vectors.
 * For unit vectors: cos(θ) = A · B
 */
export function cosineSimilarity(a: number[] | Float32Array, b: number[] | Float32Array): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return Math.max(-1, Math.min(1, dotProduct));
}
