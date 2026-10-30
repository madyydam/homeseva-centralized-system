import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /** List businesses with their latest backup package info (BK-1) */
  @Get('packages')
  listPackages() {
    return this.backupService.listPackages();
  }

  /** Trigger a backup job for selected businesses (BK-3, BK-4) */
  @Post('jobs')
  triggerBackup(@Body() body: { businessIds: string[]; triggeredBy: string }) {
    return this.backupService.triggerBackup(body.businessIds, body.triggeredBy);
  }

  /** Check job status */
  @Get('jobs/:jobId')
  getJobStatus(@Param('jobId') jobId: string) {
    return this.backupService.getJobStatus(jobId);
  }
}

