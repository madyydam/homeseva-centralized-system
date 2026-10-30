import { Controller, Get, Param } from '@nestjs/common';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('business/:businessId')
  getByBusiness(@Param('businessId') businessId: string) {
    return this.employeesService.findByBusiness(businessId);
  }
}

