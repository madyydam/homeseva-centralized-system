-- CreateEnum
CREATE TYPE "TabType" AS ENUM ('MODULE', 'REPORT', 'GOOGLE_SHEET');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FinanceEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabledModules" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'own',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabs" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "TabType" NOT NULL,
    "icon" TEXT,
    "path" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tab_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tab_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheet_links" (
    "id" TEXT NOT NULL,
    "googleSheetUrl" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_entries" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_summaries" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
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

-- CreateTable
CREATE TABLE "backup_jobs" (
    "id" TEXT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_packages" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_leads" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_orders" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_measurements" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_appointments" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_inventory" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_invoices" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_studios" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "address" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_studios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_finance_transactions" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_finance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_assets" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_daily_tasks" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gentle_call_logs" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gentle_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_roleId_businessId_key" ON "users"("roleId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_businessId_key" ON "roles"("name", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_module_action_key" ON "role_permissions"("roleId", "module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tab_access_userId_tabId_key" ON "user_tab_access"("userId", "tabId");

-- CreateIndex
CREATE UNIQUE INDEX "sheet_links_tabId_key" ON "sheet_links"("tabId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_businessId_idx" ON "employees"("businessId");

-- CreateIndex
CREATE INDEX "finance_entries_businessId_entryDate_idx" ON "finance_entries"("businessId", "entryDate");

-- CreateIndex
CREATE INDEX "monthly_summaries_businessId_idx" ON "monthly_summaries"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_summaries_businessId_year_month_key" ON "monthly_summaries"("businessId", "year", "month");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_businessId_idx" ON "audit_log"("businessId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "backup_packages_businessId_idx" ON "backup_packages"("businessId");

-- CreateIndex
CREATE INDEX "backup_packages_jobId_idx" ON "backup_packages"("jobId");

-- CreateIndex
CREATE INDEX "gentle_leads_businessId_studioSlug_idx" ON "gentle_leads"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_leads_businessId_status_idx" ON "gentle_leads"("businessId", "status");

-- CreateIndex
CREATE INDEX "gentle_leads_businessId_leadDate_idx" ON "gentle_leads"("businessId", "leadDate");

-- CreateIndex
CREATE INDEX "gentle_leads_businessId_createdAt_idx" ON "gentle_leads"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "gentle_leads_businessId_updatedAt_idx" ON "gentle_leads"("businessId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "gentle_orders_businessId_studioSlug_idx" ON "gentle_orders"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_measurements_businessId_studioSlug_idx" ON "gentle_measurements"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_appointments_businessId_studioSlug_idx" ON "gentle_appointments"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_inventory_businessId_studioSlug_idx" ON "gentle_inventory"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_invoices_businessId_studioSlug_idx" ON "gentle_invoices"("businessId", "studioSlug");

-- CreateIndex
CREATE UNIQUE INDEX "gentle_studios_businessId_slug_key" ON "gentle_studios"("businessId", "slug");

-- CreateIndex
CREATE INDEX "gentle_finance_transactions_businessId_studioSlug_idx" ON "gentle_finance_transactions"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_finance_transactions_businessId_month_idx" ON "gentle_finance_transactions"("businessId", "month");

-- CreateIndex
CREATE INDEX "gentle_assets_businessId_studioSlug_idx" ON "gentle_assets"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_daily_tasks_businessId_studioSlug_idx" ON "gentle_daily_tasks"("businessId", "studioSlug");

-- CreateIndex
CREATE INDEX "gentle_call_logs_businessId_studioSlug_idx" ON "gentle_call_logs"("businessId", "studioSlug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabs" ADD CONSTRAINT "tabs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tab_access" ADD CONSTRAINT "user_tab_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tab_access" ADD CONSTRAINT "user_tab_access_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "tabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_links" ADD CONSTRAINT "sheet_links_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "tabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_links" ADD CONSTRAINT "sheet_links_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_summaries" ADD CONSTRAINT "monthly_summaries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_packages" ADD CONSTRAINT "backup_packages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "backup_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_packages" ADD CONSTRAINT "backup_packages_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_leads" ADD CONSTRAINT "gentle_leads_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_orders" ADD CONSTRAINT "gentle_orders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_measurements" ADD CONSTRAINT "gentle_measurements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_appointments" ADD CONSTRAINT "gentle_appointments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_inventory" ADD CONSTRAINT "gentle_inventory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_invoices" ADD CONSTRAINT "gentle_invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_studios" ADD CONSTRAINT "gentle_studios_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_finance_transactions" ADD CONSTRAINT "gentle_finance_transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_assets" ADD CONSTRAINT "gentle_assets_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_daily_tasks" ADD CONSTRAINT "gentle_daily_tasks_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gentle_call_logs" ADD CONSTRAINT "gentle_call_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- ============================================================================
-- SEED DATA FOR PRODUCTION VPS DEPLOYMENT
-- Zero Mock Data: Only authentic business structure, studios, and admin auth.
-- ============================================================================

-- 1. Create Super Admin User
INSERT INTO "users" (
    "id", "roleId", "passwordHash", "mustChangePass", "isActive", "isSuperAdmin", "isOwner", "failedAttempts", "createdAt", "updatedAt"
) VALUES (
    'admin_vps_root',
    'SUPER_ADMIN',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    true,
    true,
    true,
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

-- 2. Seed Standard Businesses (Gentle Hair Wigs = ID 3)
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
) ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "enabledModules" = EXCLUDED."enabledModules";

-- 3. Seed Default Studios for Gentle Hair Wigs (Zero Mock Leads)
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

-- 4. Initial Roles for Gentle Hair Wigs
INSERT INTO "roles" (
    "id", "name", "description", "isSystem", "businessId", "createdAt", "updatedAt"
) VALUES
(
    'role_sm_3',
    'Studio Manager',
    'Full studio operations management across orders, appointments, stock, and billing',
    true,
    '3',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'role_cc_3',
    'Cold Caller',
    'Dedicated telecaller access strictly focused on Client CRM & monthly call sheets',
    true,
    '3',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;
