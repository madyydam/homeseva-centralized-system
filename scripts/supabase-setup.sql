-- ============================================================================
-- HOMESEVA PRODUCTION DATABASE SETUP FOR SUPABASE (SINGLE SOURCE OF TRUTH)
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: Can be executed multiple times without errors.
-- Contains: Tables, Relationships, Indexes, Triggers, RLS Policies, Functions, & Seed Data.
-- ============================================================================

-- ─── 0. EXTENSIONS ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. ENUMS ───────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "TabType" AS ENUM ('MODULE', 'REPORT', 'GOOGLE_SHEET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FinanceEntryType" AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── 2. CORE SYSTEM & MULTI-TENANT TABLES ────────────────────────────────────

-- Businesses / Companies
CREATE TABLE IF NOT EXISTS "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabledModules" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePass" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Active User Sessions
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Roles per Business
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'own',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- Tabs / Navigation Modules
CREATE TABLE IF NOT EXISTS "tabs" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "TabType" NOT NULL,
    "icon" TEXT,
    "path" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tabs_pkey" PRIMARY KEY ("id")
);

-- User Tab Access
CREATE TABLE IF NOT EXISTS "user_tab_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tab_access_pkey" PRIMARY KEY ("id")
);

-- Sheet Links for Google Sheets Tabs
CREATE TABLE IF NOT EXISTS "sheet_links" (
    "id" TEXT NOT NULL,
    "googleSheetUrl" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sheet_links_pkey" PRIMARY KEY ("id")
);

-- Employees Register
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "joiningDate" DATE,
    "leavingDate" DATE,
    "reportingManager" TEXT,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- Finance Entries
CREATE TABLE IF NOT EXISTS "finance_entries" (
    "id" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "category" TEXT NOT NULL,
    "description" TEXT,
    "entryDate" DATE NOT NULL,
    "reference" TEXT,
    "attachmentUrl" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- Monthly Finance Summaries
CREATE TABLE IF NOT EXISTS "monthly_summaries" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalSales" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netProfit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "salaryCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- Central Audit Log
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "diff" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- Backup Jobs
CREATE TABLE IF NOT EXISTS "backup_jobs" (
    "id" TEXT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

-- Backup Packages (S3/VPS Storage)
CREATE TABLE IF NOT EXISTS "backup_packages" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "fileSizeBytes" BIGINT,
    "checksum" TEXT,
    "encryptedAt" TIMESTAMP(3),
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "downloadedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "retentionRule" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_packages_pkey" PRIMARY KEY ("id")
);

-- ─── 3. DYNAMIC CREDENTIALS & SECURITY TABLES ──────────────────────────────

-- Dynamic Company & Role-Based Credentials (Super Admin Managed)
CREATE TABLE IF NOT EXISTS "role_credentials" (
    "id" TEXT NOT NULL DEFAULT concat('rc_', gen_random_uuid()),
    "businessId" TEXT NOT NULL,
    "businessSlug" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Operations',
    "password" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_credentials_pkey" PRIMARY KEY ("id")
);

-- Master Super Admin 4-Factor Credentials (Root Security)
CREATE TABLE IF NOT EXISTS "super_admin_credentials" (
    "id" TEXT NOT NULL DEFAULT 'root',
    "username" TEXT NOT NULL DEFAULT 'superadmin@homeseva.internal',
    "passwordHash" TEXT NOT NULL,
    "pin4" TEXT NOT NULL DEFAULT '2408',
    "pin8" TEXT NOT NULL DEFAULT '84920177',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_admin_credentials_pkey" PRIMARY KEY ("id")
);

-- ─── 4. GENTLE HAIR WIGS ENTERPRISE TABLES ──────────────────────────────────

-- Client Leads CRM
CREATE TABLE IF NOT EXISTS "gentle_leads" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "srNo" INTEGER,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "studioName" TEXT NOT NULL DEFAULT 'Studio of Viman Nagar',
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Interested',
    "customStatusText" TEXT,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "notesList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "source" TEXT,
    "stage" TEXT,
    "hairLossConcern" TEXT,
    "interestCategory" TEXT,
    "estimatedBudget" DECIMAL(12,2),
    "assignedSpecialist" TEXT,
    "lastContactDate" TEXT,
    "nextFollowUpDate" TEXT,
    "notes" TEXT,
    "priority" TEXT DEFAULT 'Normal',
    "leadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_leads_pkey" PRIMARY KEY ("id")
);

-- Custom Wig Orders
CREATE TABLE IF NOT EXISTS "gentle_orders" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "wigType" TEXT NOT NULL,
    "density" TEXT NOT NULL,
    "hairLength" TEXT NOT NULL,
    "hairShade" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "advancePaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fittingDate" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Measurements Recorded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_orders_pkey" PRIMARY KEY ("id")
);

-- Head Contouring & Scalp Measurements
CREATE TABLE IF NOT EXISTS "gentle_measurements" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hairLossType" TEXT NOT NULL,
    "circumference" TEXT NOT NULL,
    "frontToNape" TEXT NOT NULL,
    "earToEar" TEXT NOT NULL,
    "templeToTemple" TEXT NOT NULL,
    "baseSize" TEXT NOT NULL,
    "baseMaterial" TEXT NOT NULL,
    "attachmentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "recordedAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_measurements_pkey" PRIMARY KEY ("id")
);

-- Private Suite Appointments
CREATE TABLE IF NOT EXISTS "gentle_appointments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "suite" TEXT NOT NULL,
    "stylistName" TEXT NOT NULL,
    "appointmentDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_appointments_pkey" PRIMARY KEY ("id")
);

-- Hair System Stock & Consumables Inventory
CREATE TABLE IF NOT EXISTS "gentle_inventory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Units',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_inventory_pkey" PRIMARY KEY ("id")
);

-- GST Invoices & Billing
CREATE TABLE IF NOT EXISTS "gentle_invoices" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "invoiceNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "itemsSummary" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "gstAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'UPI / QR Pay',
    "paymentStatus" TEXT NOT NULL DEFAULT 'Paid',
    "invoiceDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_invoices_pkey" PRIMARY KEY ("id")
);

-- Physical Studios / Branch Lounges
CREATE TABLE IF NOT EXISTS "gentle_studios" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "address" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_studios_pkey" PRIMARY KEY ("id")
);

-- Cash Flow & Expense Transactions
CREATE TABLE IF NOT EXISTS "gentle_finance_transactions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'UPI / QR Pay',
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_finance_transactions_pkey" PRIMARY KEY ("id")
);

-- Studio Assets & Salon Equipment
CREATE TABLE IF NOT EXISTS "gentle_assets" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL DEFAULT 'Good',
    "purchaseCost" DECIMAL(12,2) NOT NULL,
    "location" TEXT NOT NULL,
    "lastServiceDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_assets_pkey" PRIMARY KEY ("id")
);

-- Daily Task Checklist
CREATE TABLE IF NOT EXISTS "gentle_daily_tasks" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "taskTitle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_daily_tasks_pkey" PRIMARY KEY ("id")
);

-- Telecalling Logs
CREATE TABLE IF NOT EXISTS "gentle_call_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL DEFAULT 'viman-nagar',
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gentle_call_logs_pkey" PRIMARY KEY ("id")
);

-- ─── 5. UNIQUE CONSTRAINTS & HIGH-PERFORMANCE INDEXES ───────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_slug_key" ON "businesses"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "users_roleId_businessId_key" ON "users"("roleId", "businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_businessId_key" ON "roles"("name", "businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_roleId_module_action_key" ON "role_permissions"("roleId", "module", "action");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_tab_access_userId_tabId_key" ON "user_tab_access"("userId", "tabId");
CREATE UNIQUE INDEX IF NOT EXISTS "sheet_links_tabId_key" ON "sheet_links"("tabId");
CREATE UNIQUE INDEX IF NOT EXISTS "employees_employeeCode_key" ON "employees"("employeeCode");
CREATE UNIQUE INDEX IF NOT EXISTS "employees_userId_key" ON "employees"("userId");
CREATE INDEX IF NOT EXISTS "employees_businessId_idx" ON "employees"("businessId");
CREATE INDEX IF NOT EXISTS "finance_entries_businessId_entryDate_idx" ON "finance_entries"("businessId", "entryDate");
CREATE INDEX IF NOT EXISTS "monthly_summaries_businessId_idx" ON "monthly_summaries"("businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_summaries_businessId_year_month_key" ON "monthly_summaries"("businessId", "year", "month");
CREATE INDEX IF NOT EXISTS "audit_log_userId_idx" ON "audit_log"("userId");
CREATE INDEX IF NOT EXISTS "audit_log_businessId_idx" ON "audit_log"("businessId");
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log"("action");
CREATE INDEX IF NOT EXISTS "audit_log_createdAt_idx" ON "audit_log"("createdAt");
CREATE INDEX IF NOT EXISTS "backup_packages_businessId_idx" ON "backup_packages"("businessId");
CREATE INDEX IF NOT EXISTS "backup_packages_jobId_idx" ON "backup_packages"("jobId");

-- Role Credentials unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "role_credentials_businessSlug_role_key" ON "role_credentials"("businessSlug", "role");
CREATE INDEX IF NOT EXISTS "role_credentials_businessSlug_idx" ON "role_credentials"("businessSlug");
CREATE INDEX IF NOT EXISTS "role_credentials_businessId_idx" ON "role_credentials"("businessId");

-- Gentle Hair Wigs indexes
CREATE INDEX IF NOT EXISTS "gentle_leads_businessId_studioSlug_idx" ON "gentle_leads"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_leads_businessId_status_idx" ON "gentle_leads"("businessId", "status");
CREATE INDEX IF NOT EXISTS "gentle_leads_businessId_leadDate_idx" ON "gentle_leads"("businessId", "leadDate");
CREATE INDEX IF NOT EXISTS "gentle_leads_businessId_createdAt_idx" ON "gentle_leads"("businessId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "gentle_leads_businessId_updatedAt_idx" ON "gentle_leads"("businessId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "gentle_orders_businessId_studioSlug_idx" ON "gentle_orders"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_measurements_businessId_studioSlug_idx" ON "gentle_measurements"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_appointments_businessId_studioSlug_idx" ON "gentle_appointments"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_inventory_businessId_studioSlug_idx" ON "gentle_inventory"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_invoices_businessId_studioSlug_idx" ON "gentle_invoices"("businessId", "studioSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "gentle_studios_businessId_slug_key" ON "gentle_studios"("businessId", "slug");
CREATE INDEX IF NOT EXISTS "gentle_finance_transactions_businessId_studioSlug_idx" ON "gentle_finance_transactions"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_finance_transactions_businessId_month_idx" ON "gentle_finance_transactions"("businessId", "month");
CREATE INDEX IF NOT EXISTS "gentle_assets_businessId_studioSlug_idx" ON "gentle_assets"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_daily_tasks_businessId_studioSlug_idx" ON "gentle_daily_tasks"("businessId", "studioSlug");
CREATE INDEX IF NOT EXISTS "gentle_call_logs_businessId_studioSlug_idx" ON "gentle_call_logs"("businessId", "studioSlug");

-- ─── 6. FOREIGN KEY CONSTRAINTS ─────────────────────────────────────────────

DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "roles" ADD CONSTRAINT "roles_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "tabs" ADD CONSTRAINT "tabs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "user_tab_access" ADD CONSTRAINT "user_tab_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "user_tab_access" ADD CONSTRAINT "user_tab_access_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "tabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "sheet_links" ADD CONSTRAINT "sheet_links_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "tabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "sheet_links" ADD CONSTRAINT "sheet_links_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "employees" ADD CONSTRAINT "employees_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "monthly_summaries" ADD CONSTRAINT "monthly_summaries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "backup_packages" ADD CONSTRAINT "backup_packages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "backup_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "backup_packages" ADD CONSTRAINT "backup_packages_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_leads" ADD CONSTRAINT "gentle_leads_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_orders" ADD CONSTRAINT "gentle_orders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_measurements" ADD CONSTRAINT "gentle_measurements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_appointments" ADD CONSTRAINT "gentle_appointments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_inventory" ADD CONSTRAINT "gentle_inventory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_invoices" ADD CONSTRAINT "gentle_invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_studios" ADD CONSTRAINT "gentle_studios_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_finance_transactions" ADD CONSTRAINT "gentle_finance_transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_assets" ADD CONSTRAINT "gentle_assets_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_daily_tasks" ADD CONSTRAINT "gentle_daily_tasks_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "gentle_call_logs" ADD CONSTRAINT "gentle_call_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 7. AUTOMATIC TIMESTAMP TRIGGERS & PROCEDURES ───────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to all tables with updatedAt
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'businesses', 'users', 'roles', 'tabs', 'sheet_links', 'employees',
        'finance_entries', 'monthly_summaries', 'backup_packages',
        'role_credentials', 'super_admin_credentials',
        'gentle_leads', 'gentle_orders', 'gentle_measurements', 'gentle_appointments',
        'gentle_inventory', 'gentle_invoices', 'gentle_studios', 'gentle_finance_transactions',
        'gentle_assets', 'gentle_daily_tasks', 'gentle_call_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_updated_at ON %I;', tbl);
        EXECUTE format('CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl);
    END LOOP;
END $$;

-- ─── 8. SECURE BACKEND FUNCTIONS (SECURITY DEFINER) ─────────────────────────

-- Verify Super Admin Credentials (4-factor: username, password, 4-digit PIN, 8-digit PIN)
CREATE OR REPLACE FUNCTION verify_super_admin_credentials(
    p_username TEXT,
    p_password TEXT,
    p_pin4 TEXT,
    p_pin8 TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_found BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM "super_admin_credentials"
        WHERE (LOWER("username") = LOWER(TRIM(p_username)) OR TRIM(p_username) IN ('admin', 'superadmin'))
          AND "passwordHash" = TRIM(p_password)
          AND "pin4" = TRIM(p_pin4)
          AND "pin8" = TRIM(p_pin8)
    ) INTO v_found;

    RETURN v_found;
END;
$$;

-- Update Super Admin Credentials
CREATE OR REPLACE FUNCTION update_super_admin_credentials(
    p_username TEXT,
    p_password TEXT,
    p_pin4 TEXT,
    p_pin8 TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "super_admin_credentials" ("id", "username", "passwordHash", "pin4", "pin8", "updatedAt")
    VALUES ('root', TRIM(p_username), TRIM(p_password), TRIM(p_pin4), TRIM(p_pin8), CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO UPDATE SET
        "username" = EXCLUDED."username",
        "passwordHash" = EXCLUDED."passwordHash",
        "pin4" = EXCLUDED."pin4",
        "pin8" = EXCLUDED."pin8",
        "updatedAt" = CURRENT_TIMESTAMP;

    -- Also keep User table in sync
    UPDATE "users"
    SET "passwordHash" = TRIM(p_password),
        "totpSecret" = concat(TRIM(p_pin4), ':', TRIM(p_pin8)),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = 'admin_vps_root' OR "isSuperAdmin" = true;

    RETURN true;
END;
$$;

-- Verify Company Role Credentials
CREATE OR REPLACE FUNCTION verify_role_credentials(
    p_business_slug TEXT,
    p_role TEXT,
    p_password TEXT,
    p_pin TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_row RECORD;
BEGIN
    SELECT * INTO v_row
    FROM "role_credentials"
    WHERE "businessSlug" = TRIM(p_business_slug)
      AND "role" = TRIM(p_role)
      AND "password" = TRIM(p_password)
      AND ("pin" = '' OR "pin" = TRIM(p_pin));

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'role', v_row."role",
            'label', v_row."label",
            'department', v_row."department",
            'businessSlug', v_row."businessSlug"
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid password or PIN.');
    END IF;
END;
$$;

-- Update Role Password & PIN (Super Admin Managed)
CREATE OR REPLACE FUNCTION update_role_credentials(
    p_business_slug TEXT,
    p_role TEXT,
    p_new_password TEXT,
    p_new_pin TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE "role_credentials"
    SET "password" = TRIM(p_new_password),
        "pin" = TRIM(p_new_pin),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "businessSlug" = TRIM(p_business_slug)
      AND "role" = TRIM(p_role);

    RETURN FOUND;
END;
$$;

-- ─── 9. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE "businesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tabs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_tab_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sheet_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "finance_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "monthly_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "backup_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "backup_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "super_admin_credentials" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "gentle_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_measurements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_studios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_finance_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_daily_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gentle_call_logs" ENABLE ROW LEVEL SECURITY;

-- 1. Service Role full access across all tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'businesses', 'users', 'sessions', 'roles', 'role_permissions', 'user_roles',
        'tabs', 'user_tab_access', 'sheet_links', 'employees', 'finance_entries',
        'monthly_summaries', 'audit_log', 'backup_jobs', 'backup_packages',
        'role_credentials', 'super_admin_credentials',
        'gentle_leads', 'gentle_orders', 'gentle_measurements', 'gentle_appointments',
        'gentle_inventory', 'gentle_invoices', 'gentle_studios', 'gentle_finance_transactions',
        'gentle_assets', 'gentle_daily_tasks', 'gentle_call_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "service_role_full_access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- 2. Public Read for Active Businesses & Studios (For branding & navigation on signin)
DROP POLICY IF EXISTS "public_read_active_businesses" ON "businesses";
CREATE POLICY "public_read_active_businesses" ON "businesses"
    FOR SELECT TO anon, authenticated
    USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_studios" ON "gentle_studios";
CREATE POLICY "public_read_studios" ON "gentle_studios"
    FOR SELECT TO anon, authenticated
    USING (true);

-- 3. Authenticated Tenant Scoping for Gentle Hair Wigs data
DROP POLICY IF EXISTS "tenant_leads_policy" ON "gentle_leads";
CREATE POLICY "tenant_leads_policy" ON "gentle_leads"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_orders_policy" ON "gentle_orders";
CREATE POLICY "tenant_orders_policy" ON "gentle_orders"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_measurements_policy" ON "gentle_measurements";
CREATE POLICY "tenant_measurements_policy" ON "gentle_measurements"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_appointments_policy" ON "gentle_appointments";
CREATE POLICY "tenant_appointments_policy" ON "gentle_appointments"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_inventory_policy" ON "gentle_inventory";
CREATE POLICY "tenant_inventory_policy" ON "gentle_inventory"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_invoices_policy" ON "gentle_invoices";
CREATE POLICY "tenant_invoices_policy" ON "gentle_invoices"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_finance_policy" ON "gentle_finance_transactions";
CREATE POLICY "tenant_finance_policy" ON "gentle_finance_transactions"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_assets_policy" ON "gentle_assets";
CREATE POLICY "tenant_assets_policy" ON "gentle_assets"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_tasks_policy" ON "gentle_daily_tasks";
CREATE POLICY "tenant_tasks_policy" ON "gentle_daily_tasks"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

DROP POLICY IF EXISTS "tenant_call_logs_policy" ON "gentle_call_logs";
CREATE POLICY "tenant_call_logs_policy" ON "gentle_call_logs"
    FOR ALL TO authenticated
    USING ("businessId" = '3')
    WITH CHECK ("businessId" = '3');

-- ─── 10. SEED DATA MIGRATION & BOOTSTRAP ─────────────────────────────────────

-- 10.1 Master Super Admin 4-Factor Credentials
INSERT INTO "super_admin_credentials" (
    "id", "username", "passwordHash", "pin4", "pin8", "updatedAt"
) VALUES (
    'root',
    'superadmin@homeseva.internal',
    'SuperAdmin@HomeSeva2026!',
    '2408',
    '84920177',
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO UPDATE SET
    "username" = EXCLUDED."username",
    "passwordHash" = EXCLUDED."passwordHash",
    "pin4" = EXCLUDED."pin4",
    "pin8" = EXCLUDED."pin8";

-- Backward compatibility root user
INSERT INTO "users" (
    "id", "roleId", "passwordHash", "mustChangePass", "isActive", "isSuperAdmin", "isOwner", "totpSecret", "failedAttempts", "createdAt", "updatedAt"
) VALUES (
    'admin_vps_root',
    'SUPER_ADMIN',
    'SuperAdmin@HomeSeva2026!',
    false,
    true,
    true,
    true,
    '2408:84920177',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO UPDATE SET
    "passwordHash" = EXCLUDED."passwordHash",
    "totpSecret" = EXCLUDED."totpSecret";

-- 10.2 All Standard Businesses / Companies
INSERT INTO "businesses" (
    "id", "name", "slug", "logoUrl", "description", "isActive", "enabledModules", "createdAt", "updatedAt"
) VALUES 
(
    '3',
    'Gentle Hair Wigs',
    'gentle-hair-wigs',
    '/logos/gentle-hair-wigs-logo.jpg',
    'Custom Hair Systems, Medical Prosthetics & Aesthetic Salons',
    true,
    ARRAY['crm', 'orders', 'measurements', 'appointments', 'inventory', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '1',
    'Prefab Construction Solutions',
    'prefab-construction',
    NULL,
    'Industrial Prefab & Modular Infrastructure',
    true,
    ARRAY['crm', 'inventory', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '2',
    'HoReCa Essentials & Crockery Rental',
    'horeca-essentials',
    NULL,
    'Hospitality & Event Crockery Logistics',
    true,
    ARRAY['inventory', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '4',
    'Ecolab Institutional Distribution',
    'ecolab-distribution',
    NULL,
    'Hygiene & Institutional Cleaning Solutions',
    true,
    ARRAY['inventory', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '5',
    'HS Co-working Spaces',
    'hs-coworking',
    NULL,
    'Flexible Workspaces, Private Cabins & Community Meeting Rooms',
    true,
    ARRAY['crm', 'appointments', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '6',
    'First Mover Advantage',
    'first-mover-advantage',
    NULL,
    'Software Solutions & DevOps Platform Services',
    true,
    ARRAY['billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '7',
    'Printbooth Digital Printing',
    'printbooth',
    NULL,
    'High Speed Offset, Digital Printing & Fabrication Press',
    true,
    ARRAY['inventory', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '8',
    'DVE Enterprises',
    'dve-enterprises',
    NULL,
    'Commodity Trading, Bulk Distribution & Dispatch Logistics',
    true,
    ARRAY['inventory', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '9',
    'NDA Security & Facility Care',
    'nda-services',
    NULL,
    'Corporate Security Guards, Facility Maintenance & Manpower',
    true,
    ARRAY['crm', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10',
    'HS Real Estate & Assets',
    'hs-real-estate',
    NULL,
    'Commercial Leasing, Property Advisory & Asset Portfolio',
    true,
    ARRAY['crm', 'billing'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "enabledModules" = EXCLUDED."enabledModules";

-- 10.3 Gentle Hair Wigs Studios (Zero Mock Leads)
INSERT INTO "gentle_studios" (
    "id", "businessId", "slug", "name", "shortName", "address", "isCustom", "createdAt", "updatedAt"
) VALUES
(
    'std_viman_nagar',
    '3',
    'viman-nagar',
    'Studio of Viman Nagar (Pune East)',
    'Viman Nagar',
    'Phoenix Marketcity Corridor, Viman Nagar, Pune 411014',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'std_ravet',
    '3',
    'ravet',
    'Studio of Ravet (PCMC Lounge)',
    'Ravet',
    'Kiwale-Ravet BRTS Corridor, Ravet, PCMC 412101',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'std_kolhapur',
    '3',
    'kolhapur',
    'Studio of Kolhapur (South Maharashtra)',
    'Kolhapur',
    'Near Station Road, Tarabai Park, Kolhapur 416003',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("businessId", "slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "shortName" = EXCLUDED."shortName",
    "address" = EXCLUDED."address";

-- 10.4 All Company & Role Credentials in Database
INSERT INTO "role_credentials" (
    "businessId", "businessSlug", "role", "label", "department", "password", "pin", "updatedAt"
) VALUES
-- Gentle Hair Wigs
('3', 'gentle-hair-wigs', 'Studio Manager', 'Studio Manager', 'Operations', 'GentleHair@123', '2408', CURRENT_TIMESTAMP),
('3', 'gentle-hair-wigs', 'Cold Caller', 'Cold Caller / Telecaller', 'Telecalling', 'Telecaller@123', '1100', CURRENT_TIMESTAMP),
('3', 'gentle-hair-wigs', 'Senior Wig Specialist & Stylist', 'Senior Wig Specialist & Stylist', 'Styling', 'Stylist@123', '3300', CURRENT_TIMESTAMP),
('3', 'gentle-hair-wigs', 'Scalp & Measurement Consultant', 'Scalp & Measurement Consultant', 'Consultation', 'Consultant@123', '4400', CURRENT_TIMESTAMP),
('3', 'gentle-hair-wigs', 'Billing & Front Desk', 'Billing & Front Desk', 'Front Desk', 'Billing@123', '5500', CURRENT_TIMESTAMP),
('3', 'gentle-hair-wigs', 'Inventory Coordinator (Wigs & Patches)', 'Inventory Coordinator (Wigs & Patches)', 'Inventory', 'Stock@123', '6600', CURRENT_TIMESTAMP),
('3', 'gentle-hair-wigs', 'Studio Partner / Owner', 'Studio Partner / Owner', 'Executive', 'Owner@123', '9999', CURRENT_TIMESTAMP),

-- HoReCa Essentials & Crockery Rental
('2', 'horeca-essentials', 'General Manager', 'General Manager', 'Management', 'Horeca@123', '2020', CURRENT_TIMESTAMP),
('2', 'horeca-essentials', 'Sales Representative (Essentials)', 'Sales Representative (Essentials)', 'Sales', 'Sales@123', '2100', CURRENT_TIMESTAMP),
('2', 'horeca-essentials', 'Rental Logistics Supervisor', 'Rental Logistics Supervisor', 'Rental', 'Rental@123', '2200', CURRENT_TIMESTAMP),
('2', 'horeca-essentials', 'Inventory & Warehousing Desk', 'Inventory & Warehousing Desk', 'Inventory', 'Warehouse@123', '2300', CURRENT_TIMESTAMP),
('2', 'horeca-essentials', 'Banquet Billing & Invoicing', 'Banquet Billing & Invoicing', 'Finance', 'Billing@123', '2400', CURRENT_TIMESTAMP),

-- Prefab Construction Solutions
('1', 'prefab-construction', 'Project Director', 'Project Director', 'Projects', 'Prefab@123', '1010', CURRENT_TIMESTAMP),
('1', 'prefab-construction', 'Civil Site Engineer', 'Civil Site Engineer', 'Engineering', 'Engineer@123', '1020', CURRENT_TIMESTAMP),
('1', 'prefab-construction', 'Procurement & Materials Desk', 'Procurement & Materials Desk', 'Procurement', 'Procure@123', '1030', CURRENT_TIMESTAMP),
('1', 'prefab-construction', 'Billing & Contract Estimator', 'Billing & Contract Estimator', 'Commercial', 'Billing@123', '1040', CURRENT_TIMESTAMP),

-- Ecolab Institutional Distribution
('4', 'ecolab-distribution', 'Distribution Manager', 'Distribution Manager', 'Operations', 'Ecolab@123', '4010', CURRENT_TIMESTAMP),
('4', 'ecolab-distribution', 'Institutional Key Account Executive', 'Key Account Executive', 'Sales', 'Accounts@123', '4020', CURRENT_TIMESTAMP),
('4', 'ecolab-distribution', 'Chemical Safety & Stock Auditor', 'Safety & Stock Auditor', 'Compliance', 'Auditor@123', '4030', CURRENT_TIMESTAMP),
('4', 'ecolab-distribution', 'Billing & Dispatch Desk', 'Billing & Dispatch Desk', 'Logistics', 'Dispatch@123', '4040', CURRENT_TIMESTAMP),

-- HS Co-working Spaces
('5', 'hs-coworking', 'Community Manager', 'Community Manager', 'Community', 'Cowork@123', '5010', CURRENT_TIMESTAMP),
('5', 'hs-coworking', 'Front Desk Coordinator', 'Front Desk Coordinator', 'Reception', 'FrontDesk@123', '5020', CURRENT_TIMESTAMP),
('5', 'hs-coworking', 'Facility & Access Desk', 'Facility & Access Desk', 'Operations', 'Facility@123', '5030', CURRENT_TIMESTAMP),

-- First Mover Advantage
('6', 'first-mover-advantage', 'Product Lead', 'Product Lead', 'Product', 'Product@123', '6010', CURRENT_TIMESTAMP),
('6', 'first-mover-advantage', 'DevOps & Platform Desk', 'DevOps & Platform Desk', 'Engineering', 'Platform@123', '6020', CURRENT_TIMESTAMP),
('6', 'first-mover-advantage', 'Billing & Accounts', 'Billing & Accounts', 'Finance', 'Finance@123', '6030', CURRENT_TIMESTAMP),

-- Printbooth Digital Printing
('7', 'printbooth', 'Production Supervisor', 'Production Supervisor', 'Production', 'Print@123', '7010', CURRENT_TIMESTAMP),
('7', 'printbooth', 'Machine Operator', 'Machine Operator', 'Press', 'Operator@123', '7020', CURRENT_TIMESTAMP),
('7', 'printbooth', 'Counter & Delivery Desk', 'Counter & Delivery Desk', 'Dispatch', 'Counter@123', '7030', CURRENT_TIMESTAMP),

-- DVE Enterprises
('8', 'dve-enterprises', 'Trading Manager', 'Trading Manager', 'Trade', 'Trading@123', '8010', CURRENT_TIMESTAMP),
('8', 'dve-enterprises', 'Dispatch Coordinator', 'Dispatch Coordinator', 'Logistics', 'Dispatch@123', '8020', CURRENT_TIMESTAMP),
('8', 'dve-enterprises', 'Accounts Desk', 'Accounts Desk', 'Finance', 'Accounts@123', '8030', CURRENT_TIMESTAMP),

-- NDA Security & Facility Care
('9', 'nda-services', 'Operations Head', 'Operations Head', 'Security', 'Security@123', '9010', CURRENT_TIMESTAMP),
('9', 'nda-services', 'Deployment Officer', 'Deployment Officer', 'Field', 'Officer@123', '9020', CURRENT_TIMESTAMP),
('9', 'nda-services', 'Admin Desk', 'Admin Desk', 'Administration', 'Admin@123', '9030', CURRENT_TIMESTAMP),

-- HS Real Estate & Assets
('10', 'hs-real-estate', 'Portfolio Lead', 'Portfolio Lead', 'Portfolio', 'Property@123', '1110', CURRENT_TIMESTAMP),
('10', 'hs-real-estate', 'Leasing Executive', 'Leasing Executive', 'Leasing', 'Leasing@123', '1120', CURRENT_TIMESTAMP),
('10', 'hs-real-estate', 'Accounts & Legal', 'Accounts & Legal', 'Legal', 'Legal@123', '1130', CURRENT_TIMESTAMP)
ON CONFLICT ("businessSlug", "role") DO NOTHING;

-- Complete confirmation notice
DO $$ BEGIN
    RAISE NOTICE 'HomeSeva Single-Source-of-Truth Supabase Migration executed successfully with RLS, Functions, Triggers, and Seed Data.';
END $$;
