import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Skill } from '../portfolio/entities/skill.entity';
import { Certification } from '../portfolio/entities/certification.entity';
import { Project } from '../portfolio/entities/project.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Certification) private certRepo: Repository<Certification>,
    @InjectRepository(Project) private projRepo: Repository<Project>,
  ) {}

  async getAdminStats() {
    const [users, skills, certifications, projects] = await Promise.all([
      this.userRepo.count(),
      this.skillRepo.count(),
      this.certRepo.count(),
      this.projRepo.count(),
    ]);

    const recentUsers = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: {
        id: true,
        email: true,
        fullName: true,
        picture: true,
        createdAt: true,
      },
    });

    return { users, skills, certifications, projects, recentUsers };
  }

  async getAdminActivity() {
    const [users, projects] = await Promise.all([
      this.userRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: {
          id: true,
          email: true,
          fullName: true,
          picture: true,
          createdAt: true,
        },
      }),
      this.projRepo.find({
        order: { updatedAt: 'DESC' },
        take: 5,
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      }),
    ]);
    return { users, projects };
  }

  async getUsersForExport() {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
    return users;
  }
}