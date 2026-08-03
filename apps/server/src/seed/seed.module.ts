import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../portfolio/entities/profile.entity';
import { Experience } from '../portfolio/entities/experience.entity';
import { Education } from '../portfolio/entities/education.entity';
import { Skill } from '../portfolio/entities/skill.entity';
import { Project } from '../portfolio/entities/project.entity';
import { Certification } from '../portfolio/entities/certification.entity';
import { SeedService } from './seed.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Profile, Experience, Education, Skill, Project, Certification]),
    ],
    providers: [SeedService],
})
export class SeedModule { }