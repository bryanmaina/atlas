import { PrismaClient } from "@prisma/client";
import { indexDocument } from "../src/lib/vector-store";
import { generateSignatureHash } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning existing data...");
  await prisma.signature.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creating 3 distinct organizational user profiles with skills and roles...");

  // Profile 1: Administrator / Executive Approver (LEVEL_3 Authorization)
  const sarah = await prisma.user.create({
    data: {
      email: "sarah.chen@atlas.org",
      name: "Sarah Chen",
      role: "ADMIN",
      skills: "Cloud Architecture, Enterprise Governance, Risk Management, Security Auditing, Executive Sign-off",
      department: "Executive Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Profile 2: Senior Technical Validator (LEVEL_2 Authorization)
  const alex = await prisma.user.create({
    data: {
      email: "alex.rivera@atlas.org",
      name: "Alex Rivera",
      role: "VALIDATOR",
      skills: "Kubernetes, Distributed Systems, Go, Microservices, Security Review, Cloud Run",
      department: "Platform Infrastructure",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Profile 3: Standard Contributor / Engineer (LEVEL_1 Peer Review)
  const david = await prisma.user.create({
    data: {
      email: "david.kim@atlas.org",
      name: "David Kim",
      role: "CONTRIBUTOR",
      skills: "Next.js, TypeScript, React, Frontend Performance, Technical Documentation, REST APIs",
      department: "Frontend Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("📄 Creating organizational documents with content, status, and validation levels...");

  const doc1 = await prisma.document.create({
    data: {
      title: "SEC-001: Enterprise Information Security Policy & Data Governance",
      slug: "sec-001-infosec-policy",
      category: "Security",
      status: "DRAFT",
      version: 2,
      requiresSignoff: true,
      requiredValidationLevel: "LEVEL_3",
      authorId: sarah.id,
      lastEditedById: alex.id,
      tags: "security, compliance, soc2, encryption, access-control",
      summary:
        "Mandatory annual enterprise security standard covering zero-trust authentication, cryptographic key management, least-privilege cloud access, and strict data classification tiers.",
      content: `## 1. Purpose & Scope
This Information Security Policy defines the mandatory governance standards for protecting organizational intellectual property, client confidential data, and production infrastructure across all Google Cloud environments and endpoints.

## 2. Data Classification Architecture
Organizational data is categorized into four immutable tiers:
- **Restricted**: Customer PII, cryptographic keys, payment processing credentials, and production secrets. Must be encrypted at rest (AES-256 / Cloud KMS) and in transit (TLS 1.3).
- **Confidential**: Internal source code, architecture schematics, operational roadmaps, and non-public financial reports.
- **Internal**: General operating procedures, internal wiki entries, company announcements.
- **Public**: Marketing deliverables, published technical blogs, open-source packages.

## 3. Access Control & Identity Verification
- All workforce members must authenticate using Hardware Multi-Factor Authentication (FIDO2 WebAuthn / Security Keys).
- Access to production clusters and Cloud Run runtimes is provisioned strictly on a just-in-time, least-privilege role-based access control (RBAC) foundation.
- Passwords and API tokens must never be committed to source control or exposed in log pipelines.

## 4. Incident Response & Mandatory Escalation
Security incidents (unauthorized access, credential exposure, data exfiltration alerts) must be reported to **security-incident@atlas.org** within 15 minutes of initial detection.

## 5. Employee Compliance Acknowledgment
Every employee, contractor, and engineering team member is legally required to sign this document upon publication and during each annual audit review cycle.`,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: "ENG-108: Google Cloud Run & Container Architecture Standards",
      slug: "eng-108-cloud-run-standards",
      category: "Engineering",
      status: "VERIFIED",
      version: 3,
      requiresSignoff: true,
      requiredValidationLevel: "LEVEL_2",
      authorId: alex.id,
      lastEditedById: david.id,
      tags: "engineering, docker, gcp, cloud-run, architecture",
      summary:
        "Technical engineering manual for container packaging, multi-stage alpine Dockerfiles, stateless execution models, and Cloud Run autoscaling tuning.",
      content: `## 1. Architecture Paradigm
Google Cloud Run provides a serverless execution runtime for containerized microservices and full-stack web applications. All services must be packaged as immutable container images.

## 2. Docker Packaging Requirements
- Base images must utilize minimal verified distributions, such as **Alpine Linux** (\`node:20-alpine\`) or Debian Slim.
- Next.js applications must enforce \`output: 'standalone'\` in \`next.config.ts\` to generate a self-contained runtime artifact under \`.next/standalone\`.
- Applications must listen on the port specified by the \`$PORT\` environment variable (defaulting to 8080 on Cloud Run).

## 3. Statelessness & Persistent Storage
- Cloud Run containers are ephemeral; local filesystem writes to \`/tmp\` or container storage are discarded when an instance scales to zero.
- For SQLite databases in proof-of-concept deployments, initialization and schema synchronization must be handled by a startup entrypoint script (\`entrypoint.sh\`).
- Production workloads must federate to Cloud SQL (PostgreSQL) or mount Cloud Storage buckets using Cloud Storage FUSE.

## 4. Resource Allocation & Scaling
- **Default Production Profile**: CPU = 1 vCPU, Memory = 1024 MiB, Max Concurrency = 80 requests/container.
- **Cold-Start Optimization**: Keep container image size under 150MB, minimize static assets bundled into the server runtime, and pre-warm in-memory indices during application bootstrap.`,
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      title: "HR-204: Global Remote Work & Digital Workspace Policy",
      slug: "hr-204-remote-work-guidelines",
      category: "People & HR",
      status: "DRAFT",
      version: 1,
      requiresSignoff: true,
      requiredValidationLevel: "LEVEL_1",
      authorId: david.id,
      lastEditedById: null,
      tags: "hr, remote-work, equipment, benefits, workplace",
      summary:
        "Comprehensive guidelines for distributed team collaboration, core working hour overlap, home office ergonomic allowances, and intellectual property custody.",
      content: `## 1. Overview & Cultural Philosophy
Project Atlas operates under an asynchronous-first, distributed collaboration model. We measure impact, output, and collegiality rather than physical presence.

## 2. Core Working Hours & Asynchronous Etiquette
- Teams synchronize on a 4-hour daily overlap window (10:00 AM to 2:00 PM EST or local regional equivalent) for real-time meetings and sprint planning.
- Outside the core window, team members are encouraged to prioritize deep focus time. Meeting recordings, agendas, and clear written summaries must be published in Atlas for any key technical decisions.

## 3. Home Office Ergonomic & Connectivity Stipend
- Each full-time team member is eligible for a one-time **$1,500 Home Office Setup Stipend** for ergonomic chairs, standing desks, and 4K displays.
- A recurring **$100 monthly internet & utility reimbursement** is distributed automatically via standard payroll.

## 4. Equipment Security & Physical Device Handling
- Company-issued hardware (MacBook Pro / ThinkPad) is enrolled in enterprise MDM with FileVault full-disk encryption enforced.
- Company hardware must not be shared with household members or used for unauthorized peer-to-peer file sharing.

## 5. Mandatory Annual Acknowledgment
Please review and execute your digital signature below to confirm receipt of the updated 2026 remote workplace policy.`,
    },
  });

  const doc4 = await prisma.document.create({
    data: {
      title: "AI-002: Responsible AI Principles & Enterprise Model Governance",
      slug: "ai-002-responsible-ai-governance",
      category: "Product & AI",
      status: "DRAFT",
      version: 1,
      requiresSignoff: false,
      requiredValidationLevel: "LEVEL_2",
      authorId: sarah.id,
      lastEditedById: alex.id,
      tags: "ai, machine-learning, gemini, ethics, prompt-engineering",
      summary:
        "Operating framework for deploying generative AI and vector embedding systems, ensuring privacy compliance, hallucination mitigation, and ethical oversight.",
      content: `## 1. Mission Statement
Our objective is to augment human intelligence, organizational memory, and operational speed through ethical, safe, and transparent AI integrations.

## 2. Permitted Data Ingestion & Privacy Boundaries
- Zero Customer PII: Real customer personal identifiers must never be included in system prompts or training datasets.
- Approved Models: Production integrations must exclusively utilize vetted enterprise models, such as Google Gemini 1.5/2.0 and Gemini Text Embeddings (\`text-embedding-004\`) through Google GenAI SDK.
- Data Retention Opt-Out: Enterprise API agreements ensure that organizational prompts and documents are never used for base model fine-tuning.

## 3. Semantic Vector Search Safeguards
- In-memory vector stores must enforce tenant isolation and RBAC document visibility checks before returning similarity search matches to end users.
- Cosine similarity thresholds must be calibrated (e.g., minimum score > 0.60) to avoid false-positive semantic associations.
- The UI must always display confidence percentages and direct source document citations for AI answers.`,
    },
  });

  const doc5 = await prisma.document.create({
    data: {
      title: "OPS-310: Incident Response Protocol & Blameless Post-Mortems",
      slug: "ops-310-incident-response-framework",
      category: "Operations",
      status: "DRAFT",
      version: 2,
      requiresSignoff: true,
      requiredValidationLevel: "LEVEL_3",
      authorId: alex.id,
      lastEditedById: null,
      tags: "operations, sre, devops, on-call, post-mortem",
      summary:
        "Standard operating procedure for production severity classifications, pager escalation workflows, mitigation war rooms, and blameless retrospectives.",
      content: `## 1. Severity Levels & SLA Timelines
- **SEV-1 (Critical Outage)**: System-wide downtime or data integrity breach affecting >25% of active users. Response time: **< 5 minutes**. Updates every 15 minutes.
- **SEV-2 (Major Degradation)**: Core functionality degraded with no workaround available. Response time: **< 15 minutes**. Updates every 30 minutes.
- **SEV-3 (Minor Disruption)**: Localized bug with viable workaround. Response time: **< 2 hours**.
- **SEV-4 (Low Impact)**: Cosmetic or minor UX inconsistency. Handled during normal sprint cycles.

## 2. War Room Roles
During active SEV-1/SEV-2 incidents, three dedicated roles are appointed:
1. **Incident Commander (IC)**: Orchestrates investigation, assigns tasks, prevents duplicated effort.
2. **Communications Lead**: Posts regular status updates to status page and executive stakeholders.
3. **Operations / Triage Engineers**: Executes diagnostics, rolls back releases, and applies mitigation patches.

## 3. The Blameless Post-Mortem Standard
Within 48 hours of resolving a SEV-1 incident, a blameless post-mortem document must be authored. The focus is entirely on system design vulnerabilities, automated safeguards, and process improvements—never on individual blame.`,
    },
  });

  console.log("⚡ Indexing document chunks into in-memory vector store & SQLite...");
  const docsToIndex = [doc1, doc2, doc3, doc4, doc5];
  for (const doc of docsToIndex) {
    const chunkCount = await indexDocument(
      doc.id,
      doc.title,
      doc.content,
      doc.category,
      doc.status
    );
    console.log(`  ✓ Indexed "${doc.title.substring(0, 32)}..." (${chunkCount} chunks)`);
  }

  console.log("✍️ Generating digital signatures and audit records with validation levels...");

  // Sarah signed SEC-001 (LEVEL_3 validation) -> Signature 1 of 2
  const sarahHash = generateSignatureHash({
    documentId: doc1.id,
    documentTitle: doc1.title,
    documentVersion: doc1.version,
    userId: sarah.id,
    userEmail: sarah.email,
    timestamp: new Date("2026-09-20T14:30:00Z").toISOString(),
    statement: "Executive authorization: approved for organizational compliance.",
  });

  await prisma.signature.create({
    data: {
      documentId: doc1.id,
      userId: sarah.id,
      validationLevel: "LEVEL_3",
      status: "SIGNED",
      signatureHash: sarahHash,
      ipAddress: "192.168.1.100",
      userAgent: "Atlas MacClient/2.4 (Executive Admin)",
      comments: "Executive authorization approved.",
      signedAt: new Date("2026-09-20T14:30:00Z"),
    },
  });

  // Alex signed ENG-108 (LEVEL_2 validation) -> Signature 1 of 2 for doc2
  const alexHash = generateSignatureHash({
    documentId: doc2.id,
    documentTitle: doc2.title,
    documentVersion: doc2.version,
    userId: alex.id,
    userEmail: alex.email,
    timestamp: new Date("2026-09-22T10:15:00Z").toISOString(),
    statement: "Technical validation: architecture and container specs verified.",
  });

  await prisma.signature.create({
    data: {
      documentId: doc2.id,
      userId: alex.id,
      validationLevel: "LEVEL_2",
      status: "SIGNED",
      signatureHash: alexHash,
      ipAddress: "10.0.1.42",
      userAgent: "Atlas Linux/Ubuntu (Technical Validator)",
      comments: "Technical standards verified and approved.",
      signedAt: new Date("2026-09-22T10:15:00Z"),
    },
  });

  // Sarah signed ENG-108 -> Signature 2 of 2 for doc2 (Verified!)
  const sarahDoc2Hash = generateSignatureHash({
    documentId: doc2.id,
    documentTitle: doc2.title,
    documentVersion: doc2.version,
    userId: sarah.id,
    userEmail: sarah.email,
    timestamp: new Date("2026-09-23T11:00:00Z").toISOString(),
    statement: "Executive dual sign-off: verified container standards.",
  });

  await prisma.signature.create({
    data: {
      documentId: doc2.id,
      userId: sarah.id,
      validationLevel: "LEVEL_3",
      status: "SIGNED",
      signatureHash: sarahDoc2Hash,
      ipAddress: "192.168.1.100",
      userAgent: "Atlas MacClient/2.4 (Executive Admin)",
      comments: "Final verification sign-off completed.",
      signedAt: new Date("2026-09-23T11:00:00Z"),
    },
  });

  // Pending signatures for testing validation and IDOR prevention:

  // 1. Alex has a pending LEVEL_2 signature on SEC-001
  await prisma.signature.create({
    data: {
      documentId: doc1.id,
      userId: alex.id,
      validationLevel: "LEVEL_2",
      status: "PENDING",
    },
  });

  // 2. David has a pending LEVEL_1 signature on SEC-001
  await prisma.signature.create({
    data: {
      documentId: doc1.id,
      userId: david.id,
      validationLevel: "LEVEL_1",
      status: "PENDING",
    },
  });

  // 3. David has a pending LEVEL_1 signature on HR-204
  await prisma.signature.create({
    data: {
      documentId: doc3.id,
      userId: david.id,
      validationLevel: "LEVEL_1",
      status: "PENDING",
    },
  });

  // 4. Sarah has a pending LEVEL_3 signature on OPS-310
  await prisma.signature.create({
    data: {
      documentId: doc5.id,
      userId: sarah.id,
      validationLevel: "LEVEL_3",
      status: "PENDING",
    },
  });

  console.log("✅ Database seeded with 3 user profiles, skills, documents, and multi-level signatures!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
