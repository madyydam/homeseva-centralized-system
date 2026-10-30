# HomeSeva — Group ERP

> Centralized system for a group of 10 businesses · ~500 employees · PRD v1.2

## Project Structure

```
homeseva/
├── docs/                          ← All documentation
│   ├── PRD-v0.1-Basic.md          ← Original PRD (basic)
│   ├── PRD-v1.2.md                ← Latest PRD (with Backup feature)
│   └── decisions/                 ← Architecture Decision Records (ADRs)
│       ├── ADR-001-tech-stack.md
│       ├── ADR-002-backup-strategy.md
│       └── ADR-003-auth-flow.md
│
├── apps/
│   ├── web/                       ← Next.js 14 frontend (port 3000)
│   │   └── src/
│   │       ├── app/               ← App Router pages
│   │       │   ├── page.tsx               ← Home page (business cards)
│   │       │   ├── layout.tsx             ← Root layout
│   │       │   ├── globals.css
│   │       │   ├── signin/[businessSlug]/ ← Business sign-in
│   │       │   ├── super-admin/signin/    ← Super Admin sign-in
│   │       │   ├── super-admin/backup/    ← Backup & Restore screen
│   │       │   └── app/[businessSlug]/    ← Business workspace
│   │       │       └── dashboard/
│   │       ├── components/
│   │       │   ├── ui/            ← shadcn/ui base components
│   │       │   └── layout/        ← Sidebar, TopBar, etc.
│   │       ├── hooks/             ← Custom React hooks
│   │       └── lib/               ← Utilities (api client, auth helpers)
│   │
│   └── api/                       ← NestJS backend (port 4000)
│       └── src/
│           ├── main.ts            ← Entry point
│           ├── app.module.ts      ← Root module
│           ├── auth/              ← Sign-in, sessions, 2FA
│           ├── businesses/        ← Business CRUD
│           ├── employees/         ← Employee master
│           ├── audit/             ← Audit log service
│           ├── backup/            ← Backup & Restore
│           └── common/
│               ├── guards/        ← Auth + permission guards
│               ├── decorators/    ← @CurrentUser, @RequirePermission
│               └── filters/       ← Global exception filters
│
├── packages/
│   ├── db/                        ← Prisma schema + client
│   │   ├── prisma/schema.prisma   ← All models (with businessId on every table)
│   │   └── src/
│   │       ├── client.ts          ← Singleton PrismaClient
│   │       ├── index.ts           ← Re-exports
│   │       └── seed.ts            ← Dev seed (Super Admin user)
│   │
│   ├── shared/                    ← Types + constants shared by web + api
│   │   └── src/
│   │       ├── types/             ← TS interfaces (auth, business, employee, finance)
│   │       └── constants/         ← permissions.ts, roles.ts
│   │
│   └── ui/                        ← Shared React component library
│       └── src/
│           └── components/        ← Reusable components
│
├── scripts/                       ← Dev + ops scripts
│   ├── setup.ps1                  ← One-command dev setup (Windows)
│   └── db-backup.sh               ← Nightly pg_dump wrapper
│
├── docker-compose.yml             ← Postgres + Redis + MinIO
├── .env.example                   ← All env vars documented
├── package.json                   ← Root (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json                     ← Turborepo pipeline
├── tsconfig.base.json             ← Shared TS config
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 · React 18 · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | NestJS · TypeScript · modular architecture |
| Database | PostgreSQL 16 · Prisma ORM · Row Level Security |
| Permissions | CASL (shared frontend + backend) |
| Auth | JWT (HttpOnly cookie) · Argon2 · TOTP 2FA |
| Cache | Redis |
| Files | MinIO (dev) / S3 (prod) — one folder per business |
| Backup | pg_dump nightly + HomeSeva per-business packages |
| Hosting | Docker · Nginx · VPS · daily backups |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Docker Desktop

### 1. Install dependencies
```powershell
pnpm install
```

### 2. Set up environment
```powershell
Copy-Item .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure (Postgres + Redis + MinIO)
```powershell
docker compose up -d
```

### 4. Run database migrations
```powershell
pnpm db:migrate
```

### 5. Seed the database (creates Super Admin user)
```powershell
pnpm db:seed
```

### 6. Start all dev servers
```powershell
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| MinIO Console | http://localhost:9001 |
| Prisma Studio | `pnpm db:studio` |

## Default Dev Credentials

| Role | Login | Password |
|---|---|---|
| Super Admin | superadmin@homeseva.internal | ChangeMe@123 |

> ⚠️ **Change all passwords before going to production.**

## Build Phases

| Phase | Focus | Status |
|---|---|---|
| 0 — Setup | Monorepo, Docker, DB schema, CI | ✅ Complete |
| 1 — Foundation | Home page, sign-in, Super Admin, roles, tabs, audit log, nightly DB backup | 🔄 In progress |
| 2 — Backup & Restore | Per-business packages, schedule, download, restore, verification | ⏳ Planned |
| 3 — Finance & Dashboards | Income/expenses, owner dashboard, group dashboard | ⏳ Planned |
| 4 — Business Modules | One business at a time (each with backup coverage before release) | ⏳ Planned |
| 5 — HR & Approvals | Payroll, leave, approval flows, notifications | ⏳ Planned |
| 6 — Growth & Mobile | Mobile app, WhatsApp, integrations, Hindi/Marathi | ⏳ Planned |

## Key Rules (enforced by CI)

1. **Every new table MUST have a `businessId`** — automated test fails the build otherwise (BF-6)
2. **Every file upload MUST go to `{bucket}/{businessId}/...`** — scoped for per-business backup (BF-2)
3. **Permissions checked server-side on every request** — hiding a tab on screen is never the only protection (AUTH-7)
4. **No hard deletes** — all records are soft-deleted / archived (FR-8)
5. **Audit every sensitive action** — view, create, edit, delete, export, backup, restore (FR-7)

