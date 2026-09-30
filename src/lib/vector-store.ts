import prisma from "./prisma";
import { getEmbedding, cosineSimilarity } from "./embeddings";

export interface MemoryChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  documentCategory: string;
  documentStatus: string;
  chunkIndex: number;
  chunkText: string;
  vector: Float32Array;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentCategory: string;
  documentStatus: string;
  chunkIndex: number;
  chunkText: string;
  score: number;
  matchPercentage: number;
}

interface GlobalVectorState {
  isInitialized: boolean;
  chunks: MemoryChunk[];
}

const globalForVector = globalThis as unknown as {
  __atlas_vector_store?: GlobalVectorState;
};

const storeState: GlobalVectorState = globalForVector.__atlas_vector_store ?? {
  isInitialized: false,
  chunks: [],
};

if (process.env.NODE_ENV !== "production") {
  globalForVector.__atlas_vector_store = storeState;
}

/**
 * Splits document content into overlapping semantic text chunks.
 */
export function chunkText(content: string, chunkSize = 400, overlap = 80): string[] {
  if (!content || content.trim().length === 0) return [];

  // Normalize newlines
  const text = content.replace(/\r\n/g, "\n");
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + " " + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of current chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 6)).join(" ");
      currentChunk = overlapWords + " " + para;
    } else {
      currentChunk = currentChunk.length > 0 ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Fallback for long single paragraphs without double line breaks
  if (chunks.length === 1 && chunks[0].length > chunkSize * 2) {
    const raw = chunks[0];
    const subChunks: string[] = [];
    for (let i = 0; i < raw.length; i += chunkSize - overlap) {
      subChunks.push(raw.substring(i, i + chunkSize));
    }
    return subChunks;
  }

  return chunks;
}

/**
 * Warms and populates the in-memory vector store from SQLite DocumentChunk records.
 */
export async function ensureVectorStoreReady(): Promise<number> {
  if (storeState.isInitialized && storeState.chunks.length > 0) {
    return storeState.chunks.length;
  }

  try {
    const dbChunks = await prisma.documentChunk.findMany({
      include: {
        document: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    });

    storeState.chunks = dbChunks.map((c) => {
      const parsedVector = JSON.parse(c.embedding) as number[];
      return {
        id: c.id,
        documentId: c.documentId,
        documentTitle: c.document.title,
        documentCategory: c.document.category,
        documentStatus: c.document.status,
        chunkIndex: c.chunkIndex,
        chunkText: c.chunkText,
        vector: new Float32Array(parsedVector),
      };
    });

    storeState.isInitialized = true;
    return storeState.chunks.length;
  } catch (error) {
    console.error("Failed to rehydrate in-memory vector store:", error);
    return 0;
  }
}

/**
 * Indexes a document into both SQLite and the in-memory vector store.
 */
export async function indexDocument(
  documentId: string,
  title: string,
  content: string,
  category: string,
  status: string
): Promise<number> {
  // 1. Remove existing chunks for this document from SQLite and Memory
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  });
  storeState.chunks = storeState.chunks.filter((c) => c.documentId !== documentId);

  // 2. Chunk text
  const textChunks = chunkText(content);
  if (textChunks.length === 0) return 0;

  // 3. Generate embeddings & prepare records
  const newMemoryChunks: MemoryChunk[] = [];

  for (let i = 0; i < textChunks.length; i++) {
    const chunkSnippet = textChunks[i];
    // Include title in chunk context for better semantic matching
    const embeddingInput = `Title: ${title}\nCategory: ${category}\n${chunkSnippet}`;
    const embedding = await getEmbedding(embeddingInput);

    const saved = await prisma.documentChunk.create({
      data: {
        documentId,
        chunkIndex: i,
        chunkText: chunkSnippet,
        embedding: JSON.stringify(embedding),
      },
    });

    newMemoryChunks.push({
      id: saved.id,
      documentId,
      documentTitle: title,
      documentCategory: category,
      documentStatus: status,
      chunkIndex: i,
      chunkText: chunkSnippet,
      vector: new Float32Array(embedding),
    });
  }

  // 4. Update in-memory index
  storeState.chunks.push(...newMemoryChunks);
  storeState.isInitialized = true;

  return newMemoryChunks.length;
}

/**
 * Removes a document's chunks from in-memory cache.
 */
export function removeDocumentFromMemory(documentId: string): void {
  storeState.chunks = storeState.chunks.filter((c) => c.documentId !== documentId);
}

/**
 * Executes high-performance Cosine Similarity search over cached in-memory vectors.
 */
export async function searchSemanticKnowledge(
  query: string,
  topK = 6,
  minScore = 0.05
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  // Ensure index is warmed up
  await ensureVectorStoreReady();

  if (storeState.chunks.length === 0) {
    return [];
  }

  // Generate query embedding
  const queryVector = new Float32Array(await getEmbedding(query));

  // Compute cosine similarity across all in-memory chunks
  const scoredResults: SearchResult[] = [];

  for (const chunk of storeState.chunks) {
    const score = cosineSimilarity(queryVector, chunk.vector);
    if (score >= minScore) {
      scoredResults.push({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        documentCategory: chunk.documentCategory,
        documentStatus: chunk.documentStatus,
        chunkIndex: chunk.chunkIndex,
        chunkText: chunk.chunkText,
        score: Math.round(score * 1000) / 1000,
        matchPercentage: Math.max(0, Math.min(100, Math.round(score * 100))),
      });
    }
  }

  // Sort descending by similarity score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, topK);
}
