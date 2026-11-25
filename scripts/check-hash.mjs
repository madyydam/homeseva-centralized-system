import { PrismaClient } from '../packages/db/generated/client/index.js';
import bcrypt from '../apps/web/node_modules/bcryptjs/index.js';

const prisma = new PrismaClient();

async function run() {
  const rec = await prisma.superAdminCredentials.findFirst({ where: { id: 'primary' } });
  console.log('--- Super Admin Record in DB ---');
  console.log('Username:', rec?.username);
  console.log('Matches SuperAdmin@123?', rec ? await bcrypt.compare('SuperAdmin@123', rec.passwordHash) : false);
  console.log('Matches ChangeMe@123?', rec ? await bcrypt.compare('ChangeMe@123', rec.passwordHash) : false);
  console.log('Failed attempts:', rec?.failedAttempts);
  console.log('Locked until:', rec?.lockedUntil);
  await prisma.$disconnect();
}
run();
