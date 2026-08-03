import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  jobTitle!: string;

  @Column({ type: 'varchar' })
  company!: string;

  @Column({ type: 'jsonb', default: '[]' })
  description!: string[];

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'boolean', default: false })
  isCurrent!: boolean;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}