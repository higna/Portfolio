import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('generator_settings')
export class GeneratorSettings {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ type: 'jsonb' })
    settings!: any;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}