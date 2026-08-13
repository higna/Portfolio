import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratorSetting } from './generator-settings.entity';

@Injectable()
export class GeneratorSettingsService {
  constructor(
    @InjectRepository(GeneratorSetting)
    private readonly repo: Repository<GeneratorSetting>,
  ) {}

  async getForUser(userId: string) {
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async create(userId: string, name: string, settings: Record<string, any>) {
    const setting = this.repo.create({ user: { id: userId }, name, settings });
    return this.repo.save(setting);
  }

  async delete(id: string, userId: string) {
    await this.repo.delete({ id, user: { id: userId } });
    return { success: true };
  }
}