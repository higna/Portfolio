import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Profile } from './entities/profile.entity';
import { Experience } from './entities/experience.entity';
import { Education } from './entities/education.entity';
import { Skill } from './entities/skill.entity';
import { Project } from './entities/project.entity';
import { Certification } from './entities/certification.entity';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Experience, Education, Skill, Project, Certification]),
    CloudinaryModule,
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule { }