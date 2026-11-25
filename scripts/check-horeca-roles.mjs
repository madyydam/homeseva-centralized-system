import { PrismaClient } from '../packages/db/generated/client/index.js';

const prisma = new PrismaClient();

async function run() {
  const biz = await prisma.business.findFirst({ where: { slug: 'horeca-essentials' } });
  console.log('Business ID:', biz?.id);

  // Update subcompany_slug based on biz.id
  if (biz) {
    await prisma.$executeRawUnsafe(`
      UPDATE public.business_roles
      SET subcompany_slug = 'crockery-rental'
      WHERE business_id = '${biz.id}' AND role_id IN ('Owner', 'General Manager', 'Rental Logistics Supervisor', 'Inventory & Warehousing Desk', 'Banquet Billing & Invoicing')
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE public.business_roles
      SET subcompany_slug = 'essentials-sales'
      WHERE business_id = '${biz.id}' AND role_id IN ('Owner (Sales)', 'General Manager (Sales)', 'Store Manager', 'Sales Representative (Essentials)', 'Billing & Accounts', 'Logistics & Dispatch')
    `);
  }

  const roles = await prisma.businessRole.findMany({
    where: { business: { slug: 'horeca-essentials' } },
    select: { roleId: true, label: true, subcompanySlug: true },
    orderBy: { roleId: 'asc' }
  });
  console.log('Updated Roles:');
  console.table(roles);
  await prisma.$disconnect();
}
run();
