#!/usr/bin/env pwsh
# HomeSeva — One-command dev setup for Windows
# Run from the project root: .\scripts\setup.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  HomeSeva — Dev Environment Setup   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if (-not $nodeVersion) { Write-Error "Node.js not found. Install from https://nodejs.org"; exit 1 }
Write-Host "  ✓ Node.js $nodeVersion"

$pnpmVersion = pnpm --version 2>$null
if (-not $pnpmVersion) { 
  Write-Host "  Installing pnpm..." -ForegroundColor Yellow
  npm install -g pnpm
}
Write-Host "  ✓ pnpm $pnpmVersion"

$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) { Write-Error "Docker not found. Install Docker Desktop from https://docker.com"; exit 1 }
Write-Host "  ✓ $dockerVersion"

# 2. Install dependencies
Write-Host ""
Write-Host "[2/6] Installing dependencies..." -ForegroundColor Yellow
pnpm install
Write-Host "  ✓ Dependencies installed"

# 3. Copy .env if not exists
Write-Host ""
Write-Host "[3/6] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "  ✓ .env created from .env.example"
  Write-Host "  ⚠ Edit .env before running in production!" -ForegroundColor Yellow
} else {
  Write-Host "  ✓ .env already exists — skipping"
}

# 4. Start Docker services
Write-Host ""
Write-Host "[4/6] Starting Docker services (Postgres, Redis, MinIO)..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 5
Write-Host "  ✓ Docker services started"

# 5. Run migrations + seed
Write-Host ""
Write-Host "[5/6] Running database migrations..." -ForegroundColor Yellow
pnpm db:generate
pnpm db:migrate
Write-Host "  ✓ Migrations applied"

Write-Host ""
Write-Host "[6/6] Seeding database (Super Admin user)..." -ForegroundColor Yellow
pnpm db:seed
Write-Host "  ✓ Database seeded"

# Done
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Setup complete!                    " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Run: pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend  → http://localhost:3000"
Write-Host "  API       → http://localhost:4000/api/v1"
Write-Host "  MinIO     → http://localhost:9001"
Write-Host "  DB Studio → pnpm db:studio"
Write-Host ""
Write-Host "  Super Admin login:"
Write-Host "  Email    → superadmin@homeseva.internal"
Write-Host "  Password → ChangeMe@123  (change this!)" -ForegroundColor Yellow
Write-Host ""

