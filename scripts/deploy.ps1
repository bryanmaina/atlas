# ==============================================================================
# Project Atlas — Google Cloud Run Build & Deploy Script (PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   PROJECT ATLAS — CLOUD RUN BUILD & DEPLOYMENT          " -ForegroundColor Cyan
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
$serviceName = "atlas"
$repoName = "atlas-repo"
$imageTag = (Get-Date -Format "yyyyMMddHHmmss")
$imageUrl = "$region-docker.pkg.dev/$projectId/$repoName/${serviceName}:$imageTag"
$imageLatest = "$region-docker.pkg.dev/$projectId/$repoName/${serviceName}:latest"

Write-Host "`nDeployment Plan:" -ForegroundColor Green
Write-Host "  Project ID    : $projectId"
Write-Host "  Region        : $region"
Write-Host "  Cloud Run     : $serviceName"
Write-Host "  Container Img : $imageUrl"
Write-Host "  Port          : 8080"
Write-Host "  Memory / CPU  : 1 GiB / 1 vCPU"
Write-Host "===========================================================`n"

# 3. Build & Push Image via Google Cloud Build
Write-Host "Step 1/2: Submitting build to Google Cloud Build..." -ForegroundColor Yellow
& gcloud builds submit `
    --project=$projectId `
    --tag=$imageUrl `
    --tag=$imageLatest `
    .

Write-Host "✓ Container image built and pushed to Artifact Registry." -ForegroundColor Green

# 4. Deploy to Serverless Cloud Run
Write-Host "`nStep 2/2: Deploying container to Cloud Run..." -ForegroundColor Yellow
& gcloud run deploy $serviceName `
    --project=$projectId `
    --image=$imageUrl `
    --platform=managed `
    --region=$region `
    --allow-unauthenticated `
    --port=8080 `
    --memory=1Gi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=3 `
    --set-env-vars="NODE_ENV=production,PORT=8080,DATABASE_URL=file:/app/data/atlas.db"

# 5. Extract and Output Public Cloud Run URL
Write-Host "`n"
$serviceUrl = (& gcloud run services describe $serviceName --project=$projectId --platform=managed --region=$region --format='value(status.url)').Trim()

Write-Host "===========================================================" -ForegroundColor Green
Write-Host "🎉 PROJECT ATLAS DEPLOYED SUCCESSFULLY TO GOOGLE CLOUD RUN!" -ForegroundColor Green
Write-Host "`nPublic Cloud Run URL:" -ForegroundColor Cyan
Write-Host "👉 $serviceUrl" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "===========================================================" -ForegroundColor Green
