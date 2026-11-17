import { prisma } from '../packages/db/dist/index.js';

async function cleanup() {
  console.log('--- Cleaning up Test / Demo Artifacts ---');

  // 1. Delete test leads from gentle_leads
  const delGentle = await prisma.gentleHairWigsLead.deleteMany({
    where: {
      OR: [
        { clientName: { contains: 'Test' } },
        { clientName: { contains: 'Rohan' } },
        { clientName: { contains: 'Sneha' } },
        { phone: { startsWith: '981' } },
        { phone: { startsWith: '982' } },
      ],
    },
  });
  console.log(`Deleted ${delGentle.count} test leads from gentle_leads.`);

  // 2. Delete test leads from printbooth_crm_leads
  try {
    const delPb = await prisma.$executeRawUnsafe(`
      DELETE FROM public.printbooth_crm_leads
      WHERE client_name LIKE '%Test%'
         OR phone LIKE '981%'
         OR phone LIKE '982%'
         OR phone LIKE '999%'
    `);
    console.log(`Deleted ${delPb} test leads from printbooth_crm_leads.`);
  } catch (e) {
    console.warn('Printbooth table cleanup note:', e.message);
  }

  // 3. Delete any test daily reports from gentle-hair-wigs
  try {
    const delReports = await prisma.$executeRawUnsafe(`
      DELETE FROM public.gentle_daily_tasks
      WHERE task_title LIKE '%Test%'
    `);
    console.log(`Deleted ${delReports} test task/report records.`);
  } catch (e) {
    // gentle_daily_tasks might not have any
  }

  console.log('--- Cleanup Finished Successfully ---');
}

cleanup()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
