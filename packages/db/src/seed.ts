import { PrismaClient } from '../generated/client';
import bcrypt from 'bcryptjs';
import { CANONICAL_BUSINESSES } from './businessResolver';

const prisma = new PrismaClient();

async function hashBcrypt(value: string): Promise<string> {
  return bcrypt.hash(value, 10);
}

async function main() {
  console.log('🌱 Starting comprehensive multi-tenant database seed...');

  // 1. Seed Super Admin Credentials
  const existingSuperAdmin = await prisma.superAdminCredentials.findFirst({
    where: { id: 'primary' },
  });

  if (existingSuperAdmin) {
    console.log(`🔒 Super Admin record already exists for "${existingSuperAdmin.username}". Preserving live credentials untouched.`);
  } else {
    const superUsername = process.env['SUPER_ADMIN_USERNAME'] || 'superadmin';
    const superPassword = process.env['SUPER_ADMIN_PASSWORD'] || 'ChangeMeSuperAdmin@2026';
    const superPin4 = process.env['SUPER_ADMIN_PIN4'] || '1234';
    const superPin8 = process.env['SUPER_ADMIN_PIN8'] || '12345678';

    const [passwordHash, pin4Hash, pin8Hash] = await Promise.all([
      hashBcrypt(superPassword),
      hashBcrypt(superPin4),
      hashBcrypt(superPin8),
    ]);

    await prisma.superAdminCredentials.create({
      data: {
        id: 'primary',
        username: superUsername,
        passwordHash,
        pin4Hash,
        pin8Hash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`✅ Initial Super Admin bootstrap credentials seeded for "${superUsername}"`);
    // Also maintain the legacy User entry for backward compatibility if table exists
    try {
      await (prisma as any).user?.upsert({
        where: { roleId_businessId: { roleId: 'SUPER_ADMIN', businessId: '' } },
        update: { passwordHash },
        create: {
          roleId: 'SUPER_ADMIN',
          passwordHash,
          isSuperAdmin: true,
          mustChangePass: false,
        },
      });
    } catch (_err) {
      // Ignore if legacy users table is not present
    }
  }

  // 2. Seed All 10 Canonical Multi-Tenant Businesses
  console.log('🏢 Seeding 10 canonical businesses...');
  for (const biz of CANONICAL_BUSINESSES) {
    await prisma.business.upsert({
      where: { id: biz.id },
      update: {
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        enabledModules: biz.enabledModules,
      },
      create: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        enabledModules: biz.enabledModules,
      },
    });
  }
  console.log(`✅ 10 canonical businesses registered with deterministic UUIDs.`);

  // 3. Seed Default Studios for Gentle Hair Wigs (b1000000-0000-0000-0000-000000000003)
  const gentleBizId = 'b1000000-0000-0000-0000-000000000003';
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
          businessId: gentleBizId,
          slug: studio.slug,
        },
      },
      update: {
        name: studio.name,
        shortName: studio.shortName,
        address: studio.address,
      },
      create: {
        businessId: gentleBizId,
        slug: studio.slug,
        name: studio.name,
        shortName: studio.shortName,
        address: studio.address,
        isCustom: false,
      },
    });
  }
  console.log('✅ Gentle Hair Wigs default studios seeded.');

  // 4. Seed Standard Default Business Roles for each business
  console.log('🛡️  Seeding standard business roles...');
  const defaultRolesConfig = [
    {
      roleId: 'admin',
      label: 'Business Administrator',
      department: 'Management',
      description: 'Full administrative access to all modules and configurations',
    },
    {
      roleId: 'manager',
      label: 'Operations Manager',
      department: 'Operations',
      description: 'Operations, inventory, and order management',
    },
    {
      roleId: 'staff',
      label: 'Staff Member',
      department: 'Field Staff',
      description: 'Daily operational tasks, appointments, and report logging',
    },
  ];

  const defaultRolePassHash = await hashBcrypt('StaffPassword@2026');
  const defaultRolePinHash = await hashBcrypt('1234');

  for (const biz of CANONICAL_BUSINESSES) {
    for (const roleConf of defaultRolesConfig) {
      await prisma.businessRole.upsert({
        where: {
          businessId_roleId: {
            businessId: biz.id,
            roleId: roleConf.roleId,
          },
        },
        update: {
          label: roleConf.label,
          description: roleConf.description,
          department: roleConf.department,
        },
        create: {
          businessId: biz.id,
          roleId: roleConf.roleId,
          label: roleConf.label,
          description: roleConf.description,
          department: roleConf.department,
          password: defaultRolePassHash,
          pin: defaultRolePinHash,
          failedAttempts: 0,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Standard business roles seeded with Bcrypt hashes.');

  // 5. Seed Core Tabs for each business
  console.log('📑 Seeding core tabs & role access...');
  for (const biz of CANONICAL_BUSINESSES) {
    const roles = await prisma.businessRole.findMany({
      where: { businessId: biz.id },
    });

    const adminRole = roles.find((r) => r.roleId === 'admin');
    const managerRole = roles.find((r) => r.roleId === 'manager');
    const staffRole = roles.find((r) => r.roleId === 'staff');

    for (let i = 0; i < biz.enabledModules.length; i++) {
      const moduleKey = biz.enabledModules[i];
      if (!moduleKey) continue;
      const tabLabel = moduleKey
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const tab = await prisma.tab.upsert({
        where: {
          businessId_tabKey: {
            businessId: biz.id,
            tabKey: moduleKey,
          },
        },
        update: {
          label: tabLabel,
          sortOrder: i,
          isActive: true,
        },
        create: {
          businessId: biz.id,
          tabKey: moduleKey,
          label: tabLabel,
          path: `/businesses/${biz.slug}/${moduleKey}`,
          sortOrder: i,
          isActive: true,
        },
      });

      // Grant tab access to admin, manager, staff
      if (adminRole) {
        await prisma.roleTabAccess.upsert({
          where: { roleId_tabId: { roleId: adminRole.id, tabId: tab.id } },
          update: { canView: true, canEdit: true },
          create: {
            businessId: biz.id,
            roleId: adminRole.id,
            tabId: tab.id,
            canView: true,
            canEdit: true,
          },
        });
      }

      if (managerRole) {
        await prisma.roleTabAccess.upsert({
          where: { roleId_tabId: { roleId: managerRole.id, tabId: tab.id } },
          update: { canView: true, canEdit: true },
          create: {
            businessId: biz.id,
            roleId: managerRole.id,
            tabId: tab.id,
            canView: true,
            canEdit: true,
          },
        });
      }

      if (staffRole) {
        await prisma.roleTabAccess.upsert({
          where: { roleId_tabId: { roleId: staffRole.id, tabId: tab.id } },
          update: { canView: true, canEdit: false },
          create: {
            businessId: biz.id,
            roleId: staffRole.id,
            tabId: tab.id,
            canView: true,
            canEdit: false,
          },
        });
      }
    }
  }
  console.log('✅ Tabs and role tab access configured.');

  console.log('🏁 Multi-tenant seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
