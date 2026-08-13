import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { UserRole } from '../users/entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: Request) {
    const user = (req as any).user;
    return this.notificationsService.getForUser(user.id, user.role as UserRole);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    const user = (req as any).user;
    const count = await this.notificationsService.getUnreadCount(user.id, user.role as UserRole);
    return { count };
  }

  @Post(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    await this.notificationsService.markRead(id, user.id);
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@Req() req: Request) {
    const user = (req as any).user;
    await this.notificationsService.markAllRead(user.id, user.role as UserRole);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    await this.notificationsService.deleteNotification(id, user.id);
    return { success: true };
  }
}