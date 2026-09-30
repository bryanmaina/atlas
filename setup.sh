#!/usr/bin/env bash
# ==============================================================================
# Project Atlas — Google Cloud APIs Setup Script
#
# Enables:
# 1. Cloud Run API (run.googleapis.com)
# 2. Cloud Build API (cloudbuild.googleapis.com)
# 3. Artifact Registry API (artifactregistry.googleapis.com)
#
# Sets up Artifact Registry repository: atlas-repo
# ==============================================================================

set -euo pipefail

echo "==========================================================="
echo "   PROJECT ATLAS — GOOGLE CLOUD ENVIRONMENT SETUP        "
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
REPO_NAME="atlas-repo"

echo ""
echo "Active Configuration:"
echo "  Project ID : $PROJECT_ID"
echo "  Region     : $REGION"
echo "  Repository : $REPO_NAME"
echo "==========================================================="

# 3. Enable Required Google Cloud APIs
echo ""
echo "Step 1/2: Enabling Google Cloud APIs (Cloud Run, Cloud Build, Artifact Registry)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  --project="$PROJECT_ID"

echo "✓ APIs enabled successfully."

# 4. Create Artifact Registry Repository if not already present
echo ""
echo "Step 2/2: Ensuring Artifact Registry Docker repository exists..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --project="$PROJECT_ID" --location="$REGION" &>/dev/null; then
  echo "Creating Docker repository '$REPO_NAME' in region '$REGION'..."
  gcloud artifacts repositories create "$REPO_NAME" \
    --project="$PROJECT_ID" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Project Atlas container image repository"
  echo "✓ Artifact Registry repository '$REPO_NAME' created."
else
  echo "✓ Artifact Registry repository '$REPO_NAME' already exists in $REGION."
fi

echo ""
echo "==========================================================="
echo "✅ Google Cloud environment setup is complete!"
echo "Next step: Run './deploy.sh' to build and deploy Project Atlas to Cloud Run."
echo "==========================================================="
