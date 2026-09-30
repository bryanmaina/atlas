# ==============================================================================
# Project Atlas — Google Cloud APIs Setup Script (PowerShell)
# Enables Cloud Run, Cloud Build, and Artifact Registry APIs
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   PROJECT ATLAS — GOOGLE CLOUD ENVIRONMENT SETUP        " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Verify gcloud CLI
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: 'gcloud' CLI is not found in your PATH." -ForegroundColor Red
    Write-Host "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# 2. Resolve Project ID
$projectId = $env:GCP_PROJECT_ID
if (-not $projectId) {
    $projectId = (& gcloud config get-value project 2>$null).Trim()
}

if (-not $projectId -or $projectId -eq "(unset)") {
    $projectId = Read-Host "Enter your Google Cloud Project ID"
    if (-not $projectId) {
        Write-Host "❌ Project ID cannot be empty." -ForegroundColor Red
        exit 1
    }
    & gcloud config set project $projectId
}

$region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$repoName = "atlas-repo"

Write-Host "`nActive Configuration:" -ForegroundColor Green
Write-Host "  Project ID : $projectId"
Write-Host "  Region     : $region"
Write-Host "  Repository : $repoName"
Write-Host "===========================================================`n"

# 3. Enable Required Google Cloud APIs
Write-Host "Step 1/2: Enabling Cloud Run, Cloud Build, Artifact Registry APIs..." -ForegroundColor Yellow
& gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    iam.googleapis.com `
    --project=$projectId

Write-Host "✓ Google Cloud APIs enabled successfully." -ForegroundColor Green

# 4. Create Artifact Registry Repository
Write-Host "`nStep 2/2: Ensuring Artifact Registry Docker repository exists..." -ForegroundColor Yellow
$repoCheck = (& gcloud artifacts repositories describe $repoName --project=$projectId --location=$region 2>&1)
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Docker repository '$repoName' in region '$region'..." -ForegroundColor Cyan
    & gcloud artifacts repositories create $repoName `
        --project=$projectId `
        --repository-format=docker `
        --location=$region `
        --description="Project Atlas container image repository"
    Write-Host "✓ Artifact Registry repository '$repoName' created." -ForegroundColor Green
} else {
    Write-Host "✓ Artifact Registry repository '$repoName' already exists in $region." -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "✅ Google Cloud environment setup is complete!" -ForegroundColor Green
Write-Host "Next step: Run '.\scripts\deploy.ps1' or '.\deploy.sh' to deploy to Cloud Run." -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Cyan
