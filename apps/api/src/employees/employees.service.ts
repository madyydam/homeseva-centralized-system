import { Injectable } from '@nestjs/common';
import { prisma } from '@homeseva/db';
import type { EmployeeBasic } from '@homeseva/shared';

@Injectable()
export class EmployeesService {
  async findByBusiness(businessId: string): Promise<EmployeeBasic[]> {
    const list = await prisma.employee.findMany({
      where: { businessId, status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        status: true,
        businessId: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return list.map((e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      fullName: `${e.firstName} ${e.lastName}`,
      department: e.department,
      designation: e.designation,
      status: e.status as EmployeeBasic['status'],
      businessId: e.businessId,
    }));
  }
}
