import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Skill } from '../portfolio/entities/skill.entity';
import { Certification } from '../portfolio/entities/certification.entity';
import { Project } from '../portfolio/entities/project.entity';
import { ChatHistory } from '../chat/entities/chat-history.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Certification) private certRepo: Repository<Certification>,
    @InjectRepository(Project) private projRepo: Repository<Project>,
    @InjectRepository(ChatHistory) private chatHistoryRepo: Repository<ChatHistory>,
  ) { }

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

  async getAnalytics() {
    const [users, skills, projects] = await Promise.all([
      this.userRepo.find({ select: { createdAt: true } }),
      this.skillRepo.find(),
      this.projRepo.find(),
    ]);

    // User growth by month
    const userGrowth: Record<string, number> = {};
    users.forEach((u) => {
      const month = u.createdAt.toISOString().slice(0, 7);
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    });
    const userGrowthSorted = Object.entries(userGrowth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Skills by category
    const skillsByCategory: Record<string, number> = {};
    skills.forEach((s) => {
      const cat = s.category || 'OTHER';
      skillsByCategory[cat] = (skillsByCategory[cat] || 0) + 1;
    });
    const skillsByCategoryArray = Object.entries(skillsByCategory).map(
      ([category, count]) => ({ category, count }),
    );

    // Projects by primary tech
    const projectsByTech: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.techStack && p.techStack.length > 0) {
        const tech = p.techStack[0];
        projectsByTech[tech] = (projectsByTech[tech] || 0) + 1;
      }
    });
    const projectsByTechArray = Object.entries(projectsByTech).map(
      ([tech, count]) => ({ tech, count }),
    );

    return {
      userGrowth: userGrowthSorted,
      skillsByCategory: skillsByCategoryArray,
      projectsByTech: projectsByTechArray,
    };
  }
  async getUserStats(userId: string) {
    const conversations = await this.chatHistoryRepo
      .createQueryBuilder('chat')
      .select('COUNT(DISTINCT chat.conversationId)', 'conversations')
      .where('chat.userId = :userId', { userId })
      .getRawOne();

    const messages = await this.chatHistoryRepo.count({ where: { userId } });

    return {
      conversations: Number(conversations?.conversations || 0),
      messages,
    };
  }

  async getUserActivity(userId: string) {
    const conversations = await this.chatHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
      select: {
        id: true,
        conversationId: true,
        userMessage: true,
        createdAt: true,
      },
    });

    return {
      recentChats: conversations,
    };
  }
}