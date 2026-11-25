import { PrismaClient } from '../packages/db/generated/client/index.js';

const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRawUnsafe("ALTER TABLE public.business_roles ADD COLUMN IF NOT EXISTS subcompany_slug TEXT DEFAULT 'SHARED';");
  await prisma.$executeRawUnsafe("ALTER TABLE public.role_members ADD COLUMN IF NOT EXISTS subcompany_slug TEXT DEFAULT 'SHARED';");
  await prisma.$executeRawUnsafe("UPDATE public.business_roles SET subcompany_slug = 'crockery-rental' WHERE business_id = 'b1000000-0000-0000-0000-000000000002' AND role_id IN ('Owner', 'General Manager', 'Rental Logistics Supervisor', 'Inventory & Warehousing Desk', 'Banquet Billing & Invoicing');");
  await prisma.$executeRawUnsafe("UPDATE public.business_roles SET subcompany_slug = 'essentials-sales' WHERE business_id = 'b1000000-0000-0000-0000-000000000002' AND role_id IN ('Owner (Sales)', 'General Manager (Sales)', 'Store Manager', 'Sales Representative (Essentials)', 'Billing & Accounts', 'Logistics & Dispatch');");
  console.log('✅ Local DB schema updated successfully with subcompany_slug!');
  await prisma.$disconnect();
}
run();
