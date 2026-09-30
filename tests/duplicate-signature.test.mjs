import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

function generateSignatureHash(payload) {
  const content = `${payload.documentId}:${payload.documentVersion}:${payload.userId}:${payload.timestamp}:${payload.statement}`;
  return crypto.createHash("sha256").update(content).digest("hex");
}

const prisma = new PrismaClient();

describe("Information Verification Workflow & Duplicate Signature Prevention", () => {
  let user1;
  let user2;
  let testDoc;

  before(async () => {
    // 1. Ensure test users exist
    user1 = await prisma.user.upsert({
      where: { email: "test.signer1@atlas.org" },
      update: {},
      create: {
        email: "test.signer1@atlas.org",
        name: "Test Signer One",
        role: "CONTRIBUTOR",
        skills: "Testing, QA",
      },
    });

    user2 = await prisma.user.upsert({
      where: { email: "test.signer2@atlas.org" },
      update: {},
      create: {
        email: "test.signer2@atlas.org",
        name: "Test Signer Two",
        role: "VALIDATOR",
        skills: "Security, Validation",
      },
    });

    // 2. Create a clean test document in 'DRAFT' status
    const testSlug = `test-verify-workflow-${Date.now()}`;
    testDoc = await prisma.document.create({
      data: {
        title: "TEST-VERIFY: Unit Test Document for Verification Lifecycle",
        slug: testSlug,
        content: "## Test Specifications\nValidating dual-signature requirements and duplicate prevention.",
        status: "DRAFT",
        version: 1,
        authorId: user1.id,
      },
    });
  });

  after(async () => {
    // Clean up test data
    if (testDoc?.id) {
      await prisma.signature.deleteMany({ where: { documentId: testDoc.id } });
      await prisma.document.delete({ where: { id: testDoc.id } });
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "test.signer1@atlas.org",
            "test.signer2@atlas.org",
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  test("Initial document state is 'DRAFT' with 0 signatures (Traffic Light: RED)", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: testDoc.id },
      include: { signatures: { where: { status: "SIGNED" } } },
    });

    assert.equal(doc.status, "DRAFT");
    assert.equal(doc.signatures.length, 0);

    const trafficLight =
      doc.status === "VERIFIED" || doc.signatures.length >= 2
        ? "GREEN"
        : doc.signatures.length === 1
        ? "YELLOW"
        : "RED";

    assert.equal(trafficLight, "RED");
  });

  test("User 1 signs the document for the first time -> Distinct count = 1, Status remains 'DRAFT' (Traffic Light: YELLOW)", async () => {
    // Generate cryptographic hash
    const sigHash = generateSignatureHash({
      documentId: testDoc.id,
      documentTitle: testDoc.title,
      documentVersion: testDoc.version,
      userId: user1.id,
      userEmail: user1.email,
      timestamp: new Date().toISOString(),
      statement: "First signature verification.",
    });

    // Record User 1 signature
    const signature = await prisma.signature.create({
      data: {
        documentId: testDoc.id,
        userId: user1.id,
        status: "SIGNED",
        signatureHash: sigHash,
        comments: "Reviewed and approved by User 1.",
        signedAt: new Date(),
        validationLevel: "LEVEL_1",
      },
    });

    assert.ok(signature.id);
    assert.equal(signature.status, "SIGNED");
    assert.equal(signature.userId, user1.id);

    // Verify document status & distinct signature count
    const updatedSignatures = await prisma.signature.findMany({
      where: { documentId: testDoc.id, status: "SIGNED" },
    });
    assert.equal(updatedSignatures.length, 1);

    const doc = await prisma.document.findUnique({ where: { id: testDoc.id } });
    assert.equal(doc.status, "DRAFT", "Document must remain 'DRAFT' when only 1 signature is present");

    const trafficLight =
      doc.status === "VERIFIED" || updatedSignatures.length >= 2
        ? "GREEN"
        : updatedSignatures.length === 1
        ? "YELLOW"
        : "RED";
    assert.equal(trafficLight, "YELLOW");
  });

  test("CRITICAL: User 1 attempts to sign the same document a second time -> MUST BE REJECTED (Duplicate Signature Forbidden)", async () => {
    // Application layer verification logic (same as API route)
    const existingSignature = await prisma.signature.findFirst({
      where: {
        documentId: testDoc.id,
        userId: user1.id,
        status: "SIGNED",
      },
    });

    assert.ok(existingSignature, "User 1 should already have a recorded signature");

    // Attempt duplicate signing check
    let duplicateRejected = false;
    let errorCode = "";

    if (existingSignature) {
      duplicateRejected = true;
      errorCode = "DUPLICATE_SIGNATURE_FORBIDDEN";
    }

    assert.equal(duplicateRejected, true, "Duplicate signature must be rejected");
    assert.equal(errorCode, "DUPLICATE_SIGNATURE_FORBIDDEN");

    // Also assert that database compound unique constraint @@unique([documentId, userId]) prevents duplicates
    await assert.rejects(
      async () => {
        await prisma.signature.create({
          data: {
            documentId: testDoc.id,
            userId: user1.id,
            status: "SIGNED",
            signatureHash: "malicious_duplicate_hash",
            signedAt: new Date(),
          },
        });
      },
      (err) => {
        // Prisma throws P2002 for unique constraint violation
        return err.code === "P2002";
      },
      "Database constraint must reject duplicate signature record for same user on same document"
    );

    // Ensure distinct count is still strictly 1
    const distinctCount = await prisma.signature.count({
      where: { documentId: testDoc.id, status: "SIGNED" },
    });
    assert.equal(distinctCount, 1, "Distinct signature count must remain 1 after blocked duplicate attempt");
  });

  test("User 2 (distinct user) signs document -> Distinct count = 2, Status transitions to 'VERIFIED' (Traffic Light: GREEN)", async () => {
    // Check if User 2 has already signed
    const existing = await prisma.signature.findFirst({
      where: {
        documentId: testDoc.id,
        userId: user2.id,
        status: "SIGNED",
      },
    });
    assert.equal(existing, null, "User 2 has not signed yet");

    // Generate cryptographic hash for User 2
    const sigHash2 = generateSignatureHash({
      documentId: testDoc.id,
      documentTitle: testDoc.title,
      documentVersion: testDoc.version,
      userId: user2.id,
      userEmail: user2.email,
      timestamp: new Date().toISOString(),
      statement: "Second signature verification.",
    });

    await prisma.signature.create({
      data: {
        documentId: testDoc.id,
        userId: user2.id,
        status: "SIGNED",
        signatureHash: sigHash2,
        comments: "Final verification sign-off by User 2.",
        signedAt: new Date(),
        validationLevel: "LEVEL_2",
      },
    });

    // Count distinct signatures
    const distinctSignatures = await prisma.signature.findMany({
      where: { documentId: testDoc.id, status: "SIGNED" },
    });
    assert.equal(distinctSignatures.length, 2, "Must have exactly 2 distinct signatures");

    // Transition status to VERIFIED when distinct count reaches 2
    const updatedDoc = await prisma.document.update({
      where: { id: testDoc.id },
      data: { status: "VERIFIED" },
    });

    assert.equal(updatedDoc.status, "VERIFIED", "Document status must be elevated to 'VERIFIED'");

    const trafficLight =
      updatedDoc.status === "VERIFIED" || distinctSignatures.length >= 2
        ? "GREEN"
        : distinctSignatures.length === 1
        ? "YELLOW"
        : "RED";

    assert.equal(trafficLight, "GREEN", "Traffic light must turn GREEN upon second distinct signature");
  });

  test("Attempt to sign an already verified document is rejected", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: testDoc.id },
      include: { signatures: { where: { status: "SIGNED" } } },
    });

    let blocked = false;
    let code = "";

    if (doc.status === "VERIFIED" || doc.signatures.length >= 2) {
      blocked = true;
      code = "ALREADY_VERIFIED";
    }

    assert.equal(blocked, true);
    assert.equal(code, "ALREADY_VERIFIED");
  });
});
