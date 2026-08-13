import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../../users/entities/user.entity';

export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    userId!: string | null;

    @Column({ type: 'enum', enum: UserRole, nullable: true })
    role!: UserRole | null;

    @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
    type!: NotificationType;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}