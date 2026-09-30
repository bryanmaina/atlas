# Project Atlas — Organizational Knowledge Management PoC

An enterprise-grade, cloud-native proof of concept for organizational knowledge management and document governance. Built with **Next.js 16 (App Router)**, **Tailwind CSS**, **SQLite with Prisma**, and an **In-Memory Vector Store** with cosine similarity search, packaged for **Docker** and **Google Cloud Run**.

---

## 🌟 Key Capabilities

1. **Centralized Knowledge Catalog**:
   - Manage standard operating procedures (SOPs), engineering frameworks, and company policies.
   - Categorization by domain (*Engineering*, *Security*, *People & HR*, *Product & AI*, *Operations*).
   - Live Markdown document creation studio with dual-pane preview.

2. **In-Memory Semantic Vector Search**:
   - Natural language search across document chunks with Cosine Similarity ranking.
   - Powered by an abstract embedding engine supporting **Google Gemini `text-embedding-004`** and high-fidelity deterministic dense local vectors for offline operation.
   - Spotlight search palette accessible anywhere via <kbd>Cmd</kbd> + <kbd>K</kbd> (or <kbd>Ctrl</kbd> + <kbd>K</kbd>).

3. **Digital Signatures & Compliance Audit Trail**:
   - Formal sign-off workflow for compliance-critical policies (SOC-2, InfoSec, Remote Work).
   - Generates immutable cryptographic **SHA-256 verification digests**:
     $$\text{Digest} = \text{SHA-256}(\text{documentId} + \text{version} + \text{userId} + \text{timestamp} + \text{statement})$$
   - Real-time compliance health dashboard tracking completion rates across active personas.

4. **Multi-Stage Docker & Cloud Run Native**:
   - Optimized Next.js `standalone` container deployment.
   - Automatic database schema synchronization and seeding in `entrypoint.sh`.
   - Default port `8080` optimized for Google Cloud Run serverless container runtime.

---

## 🏗️ Architecture & Database Schema

### Prisma Schema (`prisma/schema.prisma`)

- **`User`**: Organizational personnel with roles (`ADMIN`, `MANAGER`, `CONTRIBUTOR`, `VIEWER`), department, and avatar.
- **`Document`**: Versioned policy documents, markdown content, summary, tags, and status.
- **`DocumentChunk`**: Semantic text segments and serialized vector embeddings for memory rehydration.
- **`Signature`**: Cryptographically verifiable signature records with timestamps, IP addresses, and SHA-256 digests.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 20+
- npm 10+

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/bryanmaina/atlas.git
cd atlas

# Install dependencies
npm install

# Initialize SQLite database and generate Prisma Client
npx prisma db push

# Seed rich company documents, personas, and embeddings
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view Project Atlas in your browser.

---

## 🐳 Docker Containerization

Project Atlas includes a multi-stage `Dockerfile` based on `node:20-alpine`:

```bash
# Build the container image
docker build -t atlas-poc .

# Run the container locally (mapped to port 8080)
docker run -p 8080:8080 -e PORT=8080 atlas-poc
```

Access the containerized app at [http://localhost:8080](http://localhost:8080).

---

## ☁️ Google Cloud Run Deployment Strategy

> [!IMPORTANT]
> **GOVERNANCE POLICY**: All infrastructure provisioning and cloud deployment tasks are designated as **"Asks for Review"**. Ensure billing, region, and project identity are verified prior to execution.

An automated deployment script is available at [`scripts/deploy-cloud-run.sh`](scripts/deploy-cloud-run.sh):

```bash
# 1. Authenticate and configure GCP project
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>

# 2. Review and trigger deployment script
chmod +x scripts/deploy-cloud-run.sh
./scripts/deploy-cloud-run.sh
```

### Manual Cloud Run Commands Reference

```bash
# Step 1: Enable Cloud APIs (Asks for Review)
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Step 2: Create Artifact Registry repository (Asks for Review)
gcloud artifacts repositories create atlas-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Project Atlas Container Registry"

# Step 3: Build & Submit Image via Cloud Build (Asks for Review)
gcloud builds submit --tag us-central1-docker.pkg.dev/<PROJECT_ID>/atlas-repo/atlas:latest .

# Step 4: Deploy to Cloud Run (Asks for Review)
gcloud run deploy atlas \
  --image us-central1-docker.pkg.dev/<PROJECT_ID>/atlas-repo/atlas:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=file:/app/data/atlas.db"
```

---

## 🧪 Verification & Health Checks

- **Application Health**: `GET /api/documents`
- **Semantic Vector Search**: `POST /api/search` with `{"query": "cloud run standards"}`
- **Signature Execution**: `POST /api/signatures/<id>/sign` with legal acknowledgment
- **Audit Log Verification**: `GET /api/signatures`
