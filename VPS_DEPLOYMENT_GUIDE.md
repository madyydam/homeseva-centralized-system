# 🚀 Gentle Hair Wigs & HomeSeva Enterprise: VPS Deployment Guide

This guide provides end-to-end instructions for deploying the entire portal onto any Linux VPS (Ubuntu 22.04 / 24.04 LTS, Debian 12, AWS EC2, DigitalOcean, Hetzner, etc.) with **PostgreSQL database persistence, zero mock data, and Nginx reverse proxy**.

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
- `JWT_SECRET`: Random 32+ character string.
- `NEXT_PUBLIC_APP_URL`: Your domain (e.g. `https://portal.gentlehairwigs.com`).

### Step 3: Launch Containers
```bash
docker compose -f docker-compose.vps.yml up -d --build
```

### Step 4: Verify Database & Tables
```bash
docker compose -f docker-compose.vps.yml exec postgres psql -U homeseva -d homeseva_db -c "\dt"
```
You should see all tables created:
- `gentle_leads`
- `gentle_orders`
- `gentle_measurements`
- `gentle_appointments`
- `gentle_inventory`
- `gentle_invoices`
- `gentle_studios`
- `gentle_finance_transactions`
- `gentle_assets`
- `gentle_daily_tasks`
- `gentle_call_logs`
- `businesses`
- `users`
- `roles`

### Step 5: (Optional) Set up Free SSL with Certbot
If using a domain name:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🗄️ Database Backup & Restore

### Taking a Database Backup:
```bash
docker compose -f docker-compose.vps.yml exec -T postgres pg_dump -U homeseva homeseva_db > backup_$(date +%F).sql
```

### Restoring a Backup:
```bash
cat backup_2026-10-30.sql | docker compose -f docker-compose.vps.yml exec -T postgres psql -U homeseva -d homeseva_db
```

---

## 🔐 Credentials & Initial Access
- **Super Admin User ID**: `SUPER_ADMIN`
- **Initial Password**: `ChangeMe@123` (Set to prompt password change upon first login)
- **Gentle Hair Wigs Portal Route**: `/app/gentle-hair-wigs/dashboard`
- **Telecaller / Cold Caller Route**: Role-selected at signin, dedicated to CRM & Leads.

