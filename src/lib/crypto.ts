import { createHash } from "crypto";

export interface SignatureHashPayload {
  documentId: string;
  documentTitle: string;
  documentVersion: number;
  userId: string;
  userEmail: string;
  timestamp: string;
  statement: string;
}

/**
 * Generates an immutable cryptographic SHA-256 checksum for a signature event.
 */
export function generateSignatureHash(payload: SignatureHashPayload): string {
  const serialized = JSON.stringify({
    dId: payload.documentId,
    dTitle: payload.documentTitle,
    dVer: payload.documentVersion,
    uId: payload.userId,
    uEmail: payload.userEmail,
    ts: payload.timestamp,
    stmt: payload.statement,
  });

  return createHash("sha256").update(serialized).digest("hex");
}
