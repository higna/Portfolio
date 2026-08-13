import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import AdmZip from 'adm-zip';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly portfolioService: PortfolioService,
  ) {}

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  async getStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('activity')
  @Roles(UserRole.SUPERADMIN)
  async getActivity() {
    return this.dashboardService.getAdminActivity();
  }

  @Get('export-all')
  @Roles(UserRole.SUPERADMIN)
  async exportAll(@Res() res: Response) {
    const zip = new AdmZip();

    // Add CV seed
    const cvSeed = await this.portfolioService.exportCvSeed();
    zip.addFile('cv-data.ts', Buffer.from(cvSeed, 'utf-8'));

    // Add users
    const users = await this.dashboardService.getUsersForExport();
    zip.addFile('users.json', Buffer.from(JSON.stringify(users, null, 2), 'utf-8'));

    // Add spreadsheets config if exists
    const spreadsheetConfigPath = join(process.cwd(), 'worker', 'config', 'spreadsheets.json');
    if (existsSync(spreadsheetConfigPath)) {
      zip.addFile('spreadsheets.json', readFileSync(spreadsheetConfigPath));
    }

    const buffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard-backup.zip"');
    res.send(buffer);
  }
}