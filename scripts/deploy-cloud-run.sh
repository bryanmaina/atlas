#!/usr/bin/env bash
# ==============================================================================
# Project Atlas — Google Cloud Run Deployment Script
# 
# IMPORTANT GOVERNANCE NOTICE:
# This script executes infrastructure provisioning and container deployment.
# All tasks are marked as 'Asks for Review' requiring explicit user confirmation.
# ==============================================================================

set -euo pipefail

# Configuration defaults
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="atlas"
REPO_NAME="atlas-repo"
IMAGE_TAG="latest"

echo "==========================================================="
echo "   PROJECT ATLAS — GOOGLE CLOUD RUN DEPLOYMENT REVIEW     "
echo "==========================================================="
echo "Target Project ID : ${PROJECT_ID:-[NOT SET]}"
echo "Target Region     : ${REGION}"
echo "Cloud Run Service : ${SERVICE_NAME}"
echo "Artifact Registry : ${REPO_NAME}"
echo "Target Port       : 8080"
echo "Memory Profile    : 1024 MiB"
echo "CPU Profile       : 1 vCPU"
echo "==========================================================="

if [ -z "$PROJECT_ID" ]; then
  echo "❌ ERROR: GCP Project ID is not detected. Please run 'gcloud config set project <PROJECT_ID>' or export GCP_PROJECT_ID."
  exit 1
fi

echo ""
echo "⚠️  [ASKS FOR REVIEW]: Do you want to proceed with enabling APIs, building the container image, and deploying to Google Cloud Run?"
read -p "Type 'DEPLOY' to authorize cloud execution: " CONFIRMATION

if [ "$CONFIRMATION" != "DEPLOY" ]; then
  echo "✋ Deployment cancelled by user review. No cloud changes were made."
  exit 0
fi

IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"

echo ""
echo "Step 1/4: Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

echo ""
echo "Step 2/4: Ensuring Artifact Registry Docker repository exists..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository: $REPO_NAME in $REGION..."
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Project Atlas container images"
else
  echo "✓ Artifact Registry repository $REPO_NAME already exists."
fi

echo ""
echo "Step 3/4: Building and pushing container image via Google Cloud Build..."
gcloud builds submit --tag "$IMAGE_URL" .

echo ""
echo "Step 4/4: Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URL" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=file:/app/data/atlas.db"

echo ""
echo "==========================================================="
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "Service URL:"
gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)'
echo "==========================================================="
