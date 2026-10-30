import { Controller, Get } from '@nestjs/common';
import { BusinessesService } from './businesses.service';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  /** Public endpoint for Home Page business cards (PRD Section 2) */
  @Get('public')
  getPublicList() {
    return this.businessesService.getPublicList();
  }
}

