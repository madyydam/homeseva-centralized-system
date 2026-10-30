import { Injectable } from '@nestjs/common';
import { prisma } from '@homeseva/db';

export interface AuditLogEntry {
  userId?: string;
  businessId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  diff?: object;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    await prisma.auditLog.create({ data: entry });
  }

  async findByBusiness(businessId: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { roleId: true } } },
    });
  }
}

