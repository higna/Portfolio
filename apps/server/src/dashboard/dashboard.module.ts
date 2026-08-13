import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { EventsModule } from '../common/events/events.module';
import { User } from '../users/entities/user.entity';
import { Skill } from '../portfolio/entities/skill.entity';
import { Certification } from '../portfolio/entities/certification.entity';
import { Project } from '../portfolio/entities/project.entity';
import { ChatHistory } from '../chat/entities/chat-history.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Skill, Certification, Project, ChatHistory]),
    PortfolioModule,
    EventsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}