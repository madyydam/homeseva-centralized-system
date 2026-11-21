# 🚀 HomeSeva Multi-Company Central ERP v1.6: VPS Deployment Guide

This guide provides end-to-end instructions for deploying the **HomeSeva Centralized Multi-Company ERP Platform (v1.6)** onto any Linux VPS (Ubuntu 22.04 / 24.04 LTS, Debian 12, AWS EC2, DigitalOcean, Hetzner, etc.) with **PostgreSQL / Supabase persistence, multi-tenant business modules, strict cold caller data isolation, zero mock data, and Nginx reverse proxy**.

---

## 📋 Prerequisites
1. A VPS with at least **2GB RAM** (4GB recommended).
2. Ubuntu 22.04/24.04 LTS installed.
3. Root or `sudo` SSH access.
4. Your domain pointing to your VPS IP address (optional for SSL).

---

## ⚡ Option 1: 1-Command Automated Deployment

Run this single command on your VPS:

```bash
git clone <your-repo-url> /opt/homeseva
cd /opt/homeseva
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh
```

---

## 🛠️ Option 2: Step-by-Step Manual Setup

### Step 1: Install Docker & Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Step 2: Configure Environment
```bash
cd /opt/homeseva
cp .env.vps.example .env
nano .env
```
Update:
- `POSTGRES_PASSWORD`: Choose a strong password.
- `DATABASE_URL`: Ensure the password matches `POSTGRES_PASSWORD`.
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase or PostgreSQL host URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key for database operations.
- `AUTH_SECRET`: Random 32+ character HMAC key for tamper-proof session tokens.
- `NEXT_PUBLIC_APP_URL`: Your domain (e.g. `https://erp.yourdomain.com`).

### Step 3: Run Master SQL Schema Setup
Execute the all-in-one idempotent master setup script on your database (via Supabase SQL Editor or `psql`):

```bash
# Via local / VPS psql:
docker compose -f docker-compose.vps.yml exec -T postgres psql -U homeseva -d homeseva_db < scripts/vps-setup.sql
```
This script automatically sets up:
- **10 Core Companies**: Gentle Hair Wigs, ADJS - PRINTBOOTH™, Horeca Essentials, Ecolab Distribution, HS Coworking, HS Real Estate, Prefab Construction, NDA Services, DVE Enterprises, First Mover Advantage.
- **Operational Roles & Dynamic Tabs**: Granular tab access control per company role.
- **Multi-Member Personnel Accounts**: Real database-stored member credentials (`role_members`).
- **Cold Caller Data Isolation (Section 18)**: Isolated `gentle_crm_leads` and `printbooth_crm_leads` tables partitioned by `telecaller_id`.
- **Tamper-Proof Audit Logging**: Full audit trail table (`audit_logs`).

### Step 4: Launch Application Containers
```bash
docker compose -f docker-compose.vps.yml up -d --build
```

### Step 5: Verify Active Services
```bash
docker compose -f docker-compose.vps.yml ps
```
Both the Next.js web service and database containers should show status `Up`.

### Step 6: (Optional) Set up Free SSL with Certbot
If using a custom domain:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d erp.yourdomain.com
```

---

## 🗄️ Automated Database Backup & Disaster Recovery

### 1. Weekly Automated Sunday Backup (via Cron):
Add this entry to your VPS crontab (`crontab -e`):
```bash
# Runs every Sunday at 02:00 AM, creates SHA-256 verified dump, and auto-purges older backups
0 2 * * 0 /bin/bash /opt/homeseva/scripts/db-backup.sh >> /var/log/homeseva-backup.log 2>&1
```

### 2. Manual Backup Trigger (On Demand):
```bash
bash scripts/db-backup.sh
```
*Backups are saved to `/backups/homeseva/homeseva_weekly_*.dump` with SHA-256 verification files.*

### 3. Turnkey Disaster Recovery Restore:
```bash
bash scripts/db-restore.sh /backups/homeseva/homeseva_weekly_YYYYMMDD_HHMMSS.dump
```

---

## 🔐 Credentials & Access Routes

### 1. Central Super Admin Control Center
- **Route**: `/super-admin/signin`
- **Username**: `SUPER_ADMIN`
- **Password**: Initial `ChangeMe@123` (or custom configured via Supabase)
- **PIN**: `1234`
- **Features**: Company directory, operational roles, multi-member accounts, credentials management, tab access toggles, and live system backups.

### 2. Company Business Portals (All 10 Companies)
- **Universal Route**: `/signin/[businessSlug]`
  - Gentle Hair Wigs: `/signin/gentle-hair-wigs`
  - ADJS - PRINTBOOTH™: `/signin/adjs` (or `/signin/printbooth`)
  - Horeca Essentials: `/signin/horeca-essentials`
  - Ecolab Distribution: `/signin/ecolab-distribution`
  - HS Coworking: `/signin/hs-coworking`
  - Prefab Construction: `/signin/prefab-construction`
  - Other modules: `/signin/[slug]`
- **Authentication**: Personnel sign in using their assigned Role, Email, Password, and Security PIN.

### 3. Dedicated Telecalling Desks & Data Isolation
- **Cold Caller Desk**: Dedicated 5-tab workspace (Monthly Leads Sheet, Annual 12-Month Sheets, Scheduled Follow-ups, Converted Clients, Daily Reporting).
- **Caller Isolation**: Each telecaller sees strictly their own leads and reports (`telecaller_id = member.id`).
- **Owner / Manager Inspection**: Company owners and studio managers can inspect any individual caller's workspace via the CRM Callers Directory.
