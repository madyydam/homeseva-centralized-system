import { PrismaClient } from '../generated/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin user
  const passwordHash = await hashPassword(
    process.env['SUPER_ADMIN_TEMP_PASSWORD'] ?? 'ChangeMe@123'
  );

  const superAdmin = await prisma.user.upsert({
    where: { roleId_businessId: { roleId: 'SUPER_ADMIN', businessId: '' } },
    update: {},
    create: {
      roleId: 'SUPER_ADMIN',
      passwordHash,
      isSuperAdmin: true,
      mustChangePass: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.id);

  // Seed Gentle Hair Wigs business
  const gentleBiz = await prisma.business.upsert({
    where: { slug: 'gentle-hair-wigs' },
    update: {
      name: 'Gentle Hair Wigs',
      description: 'Custom Hair Systems, Medical Prosthetics & Aesthetic Salons',
      enabledModules: ['crm', 'orders', 'measurements', 'appointments', 'inventory', 'billing'],
    },
    create: {
      id: '3',
      name: 'Gentle Hair Wigs',
      slug: 'gentle-hair-wigs',
      description: 'Custom Hair Systems, Medical Prosthetics & Aesthetic Salons',
      logoUrl: '/logos/gentle-hair-wigs-logo.jpg',
      enabledModules: ['crm', 'orders', 'measurements', 'appointments', 'inventory', 'billing'],
    },
  });
  console.log('✅ Gentle Hair Wigs Business seeded:', gentleBiz.id);

  // Seed default studios for Gentle Hair Wigs
  const defaultStudios = [
    {
      slug: 'viman-nagar',
      name: 'Studio of Viman Nagar (Pune East)',
      shortName: 'Viman Nagar',
      address: 'Phoenix Marketcity Corridor, Viman Nagar, Pune 411014',
    },
    {
      slug: 'ravet',
      name: 'Studio of Ravet (PCMC Lounge)',
      shortName: 'Ravet',
      address: 'Kiwale-Ravet BRTS Corridor, Ravet, PCMC 412101',
    },
    {
      slug: 'kolhapur',
      name: 'Studio of Kolhapur (South Maharashtra)',
      shortName: 'Kolhapur',
      address: 'Near Station Road, Tarabai Park, Kolhapur 416003',
    },
  ];

  for (const studio of defaultStudios) {
    await prisma.gentleHairWigsStudio.upsert({
      where: {
        businessId_slug: {
          businessId: gentleBiz.id,
          slug: studio.slug,
        },
      },
      update: {
        name: studio.name,
        shortName: studio.shortName,
        address: studio.address,
      },
      create: {
        businessId: gentleBiz.id,
        slug: studio.slug,
        name: studio.name,
        shortName: studio.shortName,
        address: studio.address,
        isCustom: false,
      },
    });
  }
  console.log('✅ Default studios seeded.');

  // Seed other standard businesses so multi-tenant registry is clean
  const otherBusinesses = [
    { id: '1', slug: 'prefab-construction', name: 'Prefab Construction Solutions' },
    { id: '2', slug: 'horeca-essentials', name: 'HoReCa Essentials & Crockery Rental' },
    { id: '4', slug: 'ecolab-distribution', name: 'Ecolab Institutional Distribution' },
    { id: '5', slug: 'hs-coworking', name: 'HS Co-Working Spaces' },
    { id: '6', slug: 'first-mover-advantage', name: 'First Mover Advantage Advisory' },
    { id: '7', slug: 'printbooth', name: 'PrintBooth Digital Signage & Print' },
    { id: '8', slug: 'dvr-enterprise', name: 'DVR Enterprise Logistics' },
    { id: '9', slug: 'nda-services', name: 'NDA Corporate Services' },
    { id: '10', slug: 'hs-real-estate', name: 'HS Real Estate & Asset Holdings' },
  ];

  for (const biz of otherBusinesses) {
    await prisma.business.upsert({
      where: { slug: biz.slug },
      update: { name: biz.name },
      create: {
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
      },
    });
  }
  console.log('✅ All businesses registered in PostgreSQL.');

  console.log('🏁 Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
