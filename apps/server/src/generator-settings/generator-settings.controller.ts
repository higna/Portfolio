import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeneratorSettingsService } from './generator-settings.service';

@Controller('generator-settings')
@UseGuards(JwtAuthGuard)
export class GeneratorSettingsController {
  constructor(private readonly service: GeneratorSettingsService) {}

  @Get()
  async getSettings(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.service.getForUser(userId);
  }

  @Post()
  async createSetting(
    @Req() req: Request,
    @Body() body: { name: string; settings: Record<string, any> },
  ) {
    const userId = (req as any).user.id;
    return this.service.create(userId, body.name, body.settings);
  }

  @Delete(':id')
  async deleteSetting(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.service.delete(id, userId);
  }
}