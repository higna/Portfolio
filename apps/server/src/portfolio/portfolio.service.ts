import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Experience } from './entities/experience.entity';
import { Education } from './entities/education.entity';
import { Skill } from './entities/skill.entity';
import { Project } from './entities/project.entity';
import { Certification } from './entities/certification.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    @InjectRepository(Experience) private expRepo: Repository<Experience>,
    @InjectRepository(Education) private eduRepo: Repository<Education>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Project) private projRepo: Repository<Project>,
    @InjectRepository(Certification) private certRepo: Repository<Certification>,
  ) { }

  async getProfile() {
    return this.profileRepo.findOne({ where: {} });
  }

  async updateProfile(data: any) {
    const existing = await this.profileRepo.findOne({ where: {} });
    if (existing) {
      Object.assign(existing, data);
      return this.profileRepo.save(existing);
    }
    const newProfile = this.profileRepo.create(data);
    return this.profileRepo.save(newProfile);
  }

  /* Education */
  async getEducations() {
    return this.eduRepo.find({ order: { order: 'ASC' } });
  }
  async addEducation(data: Partial<Education>) {
    const edu = this.eduRepo.create(data);
    return this.eduRepo.save(edu);
  }

  async updateEducation(id: string, data: Partial<Education>) {
    await this.eduRepo.update(id, data);
    return this.eduRepo.findOne({ where: { id } });
  }

  async deleteEducation(id: string) {
    await this.eduRepo.delete(id);
    return { success: true };
  }

  /* Experience */
  async getExperiences() {
    return this.expRepo.find({ order: { order: 'ASC' } });
  }

  async addExperience(data: Partial<Experience>) {
    if (data.endDate === '') (data as any).endDate = null;
    if (data.startDate === '') (data as any).startDate = null;
    const exp = this.expRepo.create(data);
    return this.expRepo.save(exp);
  }

  async updateExperience(id: string, data: Partial<Experience>) {
    if (data.endDate === '') (data as any).endDate = null;
    if (data.startDate === '') (data as any).startDate = null;
    await this.expRepo.update(id, data);
    return this.expRepo.findOne({ where: { id } });
  }

  async deleteExperience(id: string) {
    await this.expRepo.delete(id);
    return { success: true };
  }

  /* Skills */
  async getSkills() {
    return this.skillRepo.find();
  }
  async addSkill(data: Partial<Skill>) {
    const skill = this.skillRepo.create(data);
    return this.skillRepo.save(skill);
  }

  async updateSkill(id: string, data: Partial<Skill>) {
    await this.skillRepo.update(id, data);
    return this.skillRepo.findOne({ where: { id } });
  }

  async deleteSkill(id: string) {
    await this.skillRepo.delete(id);
    return { success: true };
  }

  /* Projects */
  async getProjects(featured?: boolean) {
    if (featured) {
      return this.projRepo.find({ where: { isFeatured: true }, order: { order: 'ASC' } });
    }
    return this.projRepo.find({ order: { order: 'ASC' } });
  }
  
  async addProject(data: Partial<Project>) {
    const project = this.projRepo.create(data);
    return this.projRepo.save(project);
  }

  async updateProject(id: string, data: Partial<Project>) {
    await this.projRepo.update(id, data);
    return this.projRepo.findOne({ where: { id } });
  }

  async deleteProject(id: string) {
    await this.projRepo.delete(id);
    return { success: true };
  }
  /* Certification */
  async getCertifications() {
    return this.certRepo.find({ order: { order: 'ASC' } });
  }

  async addCertification(data: Partial<Certification>) {
    const cert = this.certRepo.create(data);
    return this.certRepo.save(cert);
  }

  async updateCertification(id: string, data: Partial<Certification>) {
    await this.certRepo.update(id, data);
    return this.certRepo.findOne({ where: { id } });
  }

  async deleteCertification(id: string) {
    await this.certRepo.delete(id);
    return { success: true };
  }
}