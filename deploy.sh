#!/usr/bin/env bash
# ==============================================================================
# Project Atlas — Google Cloud Run Build & Deploy Script
#
# Builds the container image via Google Cloud Build and deploys to Cloud Run.
# Outputs the public HTTPS service URL upon completion.
# ==============================================================================

set -euo pipefail

echo "==========================================================="
echo "   PROJECT ATLAS — CLOUD RUN BUILD & DEPLOYMENT          "
echo "==========================================================="

# 1. Verify gcloud CLI is installed
if ! command -v gcloud &>/dev/null; then
  echo "❌ ERROR: 'gcloud' CLI is not found in your PATH."
  echo "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# 2. Resolve Active Project ID
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo "No active GCP project detected in gcloud configuration."
  read -r -p "Enter your Google Cloud Project ID: " INPUT_PROJECT_ID
  if [ -z "$INPUT_PROJECT_ID" ]; then
    echo "❌ ERROR: Project ID cannot be empty."
    exit 1
  fi
  PROJECT_ID="$INPUT_PROJECT_ID"
  gcloud config set project "$PROJECT_ID"
fi

REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="atlas"
REPO_NAME="atlas-repo"
IMAGE_TAG="$(date +%Y%m%d%H%M%S)"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"
IMAGE_LATEST="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

echo ""
echo "Deployment Plan:"
echo "  Project ID    : $PROJECT_ID"
echo "  Region        : $REGION"
echo "  Cloud Run     : $SERVICE_NAME"
echo "  Container Img : $IMAGE_URL"
echo "  Port          : 8080"
echo "  Memory / CPU  : 1 GiB / 1 vCPU"
echo "==========================================================="

# 3. Build & Push Image via Google Cloud Build
echo ""
echo "Step 1/2: Submitting build to Google Cloud Build..."
gcloud builds submit \
  --project="$PROJECT_ID" \
  --tag="$IMAGE_URL" \
  --tag="$IMAGE_LATEST" \
  .

echo "✓ Container image built and pushed to Artifact Registry."

# 4. Deploy to Serverless Cloud Run
echo ""
echo "Step 2/2: Deploying container to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --image="$IMAGE_URL" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="NODE_ENV=production,PORT=8080,DATABASE_URL=file:/app/data/atlas.db"

# 5. Extract and Output Public Cloud Run URL
echo ""
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --platform=managed \
  --region="$REGION" \
  --format='value(status.url)')

echo "==========================================================="
echo "🎉 PROJECT ATLAS DEPLOYED SUCCESSFULLY TO GOOGLE CLOUD RUN!"
echo ""
echo "Public Cloud Run URL:"
echo "👉 $SERVICE_URL"
echo "==========================================================="
