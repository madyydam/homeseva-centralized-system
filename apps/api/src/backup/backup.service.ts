import { Injectable } from '@nestjs/common';
import { prisma, Business } from '@homeseva/db';

@Injectable()
export class BackupService {
  async listPackages() {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    });

    return Promise.all(
      businesses.map(async (biz: { id: string; name: string; slug: string }) => {
        const latest = await prisma.backupPackage.findFirst({
          where: { businessId: biz.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            fileSizeBytes: true,
          },
        });
        return {
          business: biz,
          lastBackup: latest ?? null,
        };
      }),
    );
  }

  async triggerBackup(businessIds: string[], triggeredBy: string) {
    return prisma.backupJob.create({
      data: {
        triggeredBy,
        status: 'PENDING',
        packages: {
          create: businessIds.map((businessId) => ({
            businessId,
            businessName: businessId,
            status: 'PENDING',
            schemaVersion: '1.0.0',
          })),
        },
      },
      include: { packages: true },
    });
  }

  async getJobStatus(jobId: string) {
    return prisma.backupJob.findUnique({
      where: { id: jobId },
      include: { packages: true },
    });
  }
}
