import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Skill } from '../portfolio/entities/skill.entity';
import { Certification } from '../portfolio/entities/certification.entity';
import { Project } from '../portfolio/entities/project.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Skill, Certification, Project])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}