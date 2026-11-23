import { Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { HealthPingService } from './health-ping.service';
import { HealthPageService } from './health-page.service';

@Controller('health')
export class HealthController {
  constructor(private readonly ping: HealthPingService, private readonly page: HealthPageService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  dashboard(): string { return this.page.getHtml(); }

  @Get('live')
  liveness() { return { status: 'ok', service: 'portfolio-api' }; }

  @Get('data')
  data() {
    return { status: 'ok', service: 'portfolio-api', version: process.env.npm_package_version ?? 'unknown', uptime: process.uptime(), keepAlive: this.ping.getState() };
  }

  @Get('keep-alive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  keepAliveState() { return this.ping.getState(); }

  @Post('keep-alive/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  toggleKeepAlive() { return this.ping.toggle(); }

  @Post('ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  pingNow() { return this.ping.manualPing(); }
}
