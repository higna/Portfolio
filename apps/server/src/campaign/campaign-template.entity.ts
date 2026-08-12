import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('campaign_templates')
export class CampaignTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  flyerUrl!: string;        // Cloudinary URL of the uploaded flyer image

  @Column({ type: 'jsonb' })
  photoBox!: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @Column({ type: 'jsonb' })
  nameConfig!: {
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    align: string;        // 'left' | 'center' | 'right'
  };

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}