import { Controller, Get, UseGuards, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { EventsService } from '../common/events/events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import AdmZip from 'adm-zip';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly portfolioService: PortfolioService,
    private readonly eventsService: EventsService,
  ) { }

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  async getStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('user-stats')
  @Roles(UserRole.USER, UserRole.SUPERADMIN)
  async getUserStats(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getUserStats(user.id);
  }

  @Get('activity')
  @Roles(UserRole.SUPERADMIN)
  async getActivity() {
    return this.dashboardService.getAdminActivity();
  }

  @Get('analytics')
  @Roles(UserRole.SUPERADMIN)
  async getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('export-all')
  @Roles(UserRole.SUPERADMIN)
  async exportAll(@Res() res: Response) {
    const zip = new AdmZip();

    const cvSeed = await this.portfolioService.exportCvSeed();
    zip.addFile('cv-data.ts', Buffer.from(cvSeed, 'utf-8'));

    const users = await this.dashboardService.getUsersForExport();
    zip.addFile('users.json', Buffer.from(JSON.stringify(users, null, 2), 'utf-8'));

    const spreadsheetConfigPath = join(process.cwd(), 'worker', 'config', 'spreadsheets.json');
    if (existsSync(spreadsheetConfigPath)) {
      zip.addFile('spreadsheets.json', readFileSync(spreadsheetConfigPath));
    }

    const buffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard-backup.zip"');
    res.send(buffer);
  }

  @Get('events')
  @Roles(UserRole.SUPERADMIN)
  async events(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const subscription = this.eventsService.getStream().subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => subscription.unsubscribe());
  }

  @Get('user-activity')
  @Roles(UserRole.USER, UserRole.SUPERADMIN)
  async getUserActivity(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getUserActivity(user.id);
  }
}