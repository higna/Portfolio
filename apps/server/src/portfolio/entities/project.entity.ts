import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  techStack!: string[];

  @Column({ type: 'varchar', nullable: true })
  liveUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  githubUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}