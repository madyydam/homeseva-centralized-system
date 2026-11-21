# 🚀 Hostinger KVM 2 VPS: Production Deployment Guide

This guide is tailored specifically for deploying **HomeSeva Enterprise ERP (v1.6)** onto a **Hostinger KVM 2 VPS** (2 vCPU, 8 GB RAM, 100 GB NVMe, Ubuntu 22.04/24.04 LTS).

---

## ⚡ Quick Specs & Capacity
* **VPS Plan**: Hostinger KVM 2 (2 vCPU / 8 GB RAM)
* **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS 64-bit
* **Target Load**: Easily handles all 10 ERP companies, hundreds of concurrent telecallers, PostgreSQL, Redis, and Next.js with under 2.5 GB RAM used.

---

## 🛡️ Step 0: Hostinger Firewall Configuration (hPanel)
Before logging into the server, ensure web ports are open in Hostinger:
1. Log in to your [Hostinger hPanel](https://hpanel.hostinger.com).
2. Go to **VPS** -> Select your KVM 2 VPS -> **Security** -> **Firewall**.
3. Ensure these inbound ports are allowed:
   - **Port 22** (SSH)
   - **Port 80** (HTTP)
   - **Port 443** (HTTPS)

---

## 🖥️ Step 1: Connect via SSH
From your local terminal (PowerShell, Command Prompt, macOS/Linux Terminal):

```bash
ssh root@<YOUR_HOSTINGER_VPS_IP>
```
*(Enter the root password you configured during VPS setup in Hostinger hPanel).*

---

## 📦 Step 2: Clone Repository to `/opt/homeseva`
```bash
sudo mkdir -p /opt/homeseva
sudo chown -R $USER:$USER /opt/homeseva
git clone <YOUR_GIT_REPO_URL> /opt/homeseva
cd /opt/homeseva
```

---

## ⚙️ Step 3: Create & Edit Production Environment
Copy the pre-configured VPS environment file:
```bash
cp .env.vps.example .env
nano .env
```

**Key variables to set in `.env`:**
* `POSTGRES_PASSWORD`: Choose a strong password (e.g. `MySecurePass@2026`).
* `DATABASE_URL`: Update the password inside the URL to match `POSTGRES_PASSWORD`:
  `postgresql://homeseva:MySecurePass@2026@postgres:5432/homeseva_db`
* `AUTH_SECRET`: Random 64-char key (generate with `openssl rand -hex 32`).
* `JWT_SECRET`: Random 64-char key (generate with `openssl rand -hex 32`).
* `NEXT_PUBLIC_APP_URL`: Your domain or VPS IP (e.g. `http://195.35.x.x` or `https://erp.yourdomain.com`).
* `SMTP_USER` & `SMTP_PASS`: Your Gmail App Password or SMTP credentials for staff notifications.

*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit nano).*

---

## 🚀 Step 4: Run 1-Command Automated Deployment
Make the deployment script executable and run it:
```bash
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh
```

**What this automatically does:**
1. Installs Docker & Docker Compose if missing.
2. Builds the optimized Next.js production container (`homeseva_web`).
3. Launches PostgreSQL 16 (`homeseva_postgres`) with isolated localhost binding.
4. Launches Redis 7 (`homeseva_redis`).
5. Launches Nginx Reverse Proxy (`homeseva_nginx`) on ports 80 and 443.
6. Executes `scripts/vps-setup.sql` to initialize all 10 company business tables, roles, and RBAC schemas.
7. Verifies health endpoint.

---

## 🔒 Step 5: (Recommended) Point Domain & Free SSL Setup
If you have a domain or subdomain (e.g. `erp.yourdomain.com`):
1. In your DNS provider (Hostinger DNS / Cloudflare / GoDaddy), add an **A Record**:
   - **Host/Name**: `erp` (or `@` for root)
   - **Type**: `A`
   - **Points to**: `<YOUR_HOSTINGER_VPS_IP>`
2. On your VPS, run Certbot to issue a free Let's Encrypt SSL certificate:
   ```bash
   sudo apt update && sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d erp.yourdomain.com
   ```
3. Update `NEXT_PUBLIC_APP_URL` in `/opt/homeseva/.env` to `https://erp.yourdomain.com`.
4. Restart web container:
   ```bash
   docker compose -f docker-compose.vps.yml restart web nginx
   ```

---

## 🔍 Step 6: Verify Active Status & Logs
```bash
# Check running containers
docker compose -f docker-compose.vps.yml ps

# View live Next.js web logs
docker compose -f docker-compose.vps.yml logs -f web

# View database logs
docker compose -f docker-compose.vps.yml logs -f postgres
```

---

## 🔑 Accessing the Platform
* **Super Admin Portal**: `http://<YOUR_VPS_IP>/super-admin/signin` (or `https://erp.yourdomain.com/super-admin/signin`)
  - Username: configured `SUPER_ADMIN_USERNAME` (default: `madyydam`)
  - Password: configured `SUPER_ADMIN_TEMP_PASSWORD` (default: `ChangeMe@123`)
  - PIN: `1234`
* **Business Portals**: `http://<YOUR_VPS_IP>/signin/<businessSlug>`
  - Gentle Hair Wigs: `/signin/gentle-hair-wigs`
  - ADJS - PRINTBOOTH™: `/signin/adjs`
  - Horeca Essentials: `/signin/horeca-essentials`
  - HS Coworking: `/signin/hs-coworking`
  - Prefab Construction: `/signin/prefab-construction`
  - (and all other 5 companies)

---

## 🛠️ Helpful Hostinger Maintenance Commands

### Automated Database Backups:
```bash
# Take manual backup
chmod +x scripts/db-backup.sh
./scripts/db-backup.sh

# Setup automated nightly cron (runs every night at 2:00 AM)
crontab -e
# Add line:
0 2 * * * /opt/homeseva/scripts/db-backup.sh >> /var/log/homeseva_backup.log 2>&1
```

### Pulling Updates / Redeploying:
```bash
cd /opt/homeseva
git pull origin production-migration
docker compose -f docker-compose.vps.yml up -d --build
```
