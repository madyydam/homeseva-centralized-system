import { Injectable } from '@nestjs/common';
import { prisma } from '@homeseva/db';
import type { BusinessPublic } from '@homeseva/shared';

@Injectable()
export class BusinessesService {
  async getPublicList(): Promise<BusinessPublic[]> {
    const list = await prisma.business.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
    return list;
  }
}

