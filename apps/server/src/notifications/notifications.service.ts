import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { EventsService } from '../common/events/events.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly eventsService: EventsService,
  ) {}

  /*
   * Create a notification for a specific user or broadcast to a role.
   */
  async createNotification(data: {
    userId?: string | null;
    role?: UserRole | null;
    type: NotificationType;
    title: string;
    message: string;
  }): Promise<Notification> {
    const notification = this.notifRepo.create({
      userId: data.userId ?? null,
      role: data.role ?? null,
      type: data.type,
      title: data.title,
      message: data.message,
    });
    await this.notifRepo.save(notification);

    this.eventsService.emit('notification', {
      id: notification.id,
      userId: notification.userId,
      role: notification.role,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    this.logger.log(`Notification created: ${notification.title}`);
    return notification;
  }

  /*
   * Get notifications for a user, including role-based broadcasts.
   */
  async getForUser(userId: string, role: UserRole): Promise<Notification[]> {
    return this.notifRepo.find({
      where: [
        { userId },
        { userId: IsNull(), role },
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getUnreadCount(userId: string, role: UserRole): Promise<number> {
    return this.notifRepo.count({
      where: [
        { userId, isRead: false },
        { userId: IsNull(), role, isRead: false },
      ],
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update(
      { id, userId },
      { isRead: true },
    );
  }

  async markAllRead(userId: string, role: UserRole): Promise<void> {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    await this.notifRepo.update(
      { userId: IsNull(), role, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await this.notifRepo.delete({ id, userId });
  }
}