import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratorSettings } from './generator-settings.entity';

@Injectable()
export class GeneratorSettingsService {
  constructor(
    @InjectRepository(GeneratorSettings)
    private readonly settingsRepo: Repository<GeneratorSettings>,
  ) {}

  create(data: { name: string; settings: any; userId: string }) {
    const setting = this.settingsRepo.create(data);
    return this.settingsRepo.save(setting);
  }

  findAllByUser(userId: string) {
    return this.settingsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findOne(id: string, userId: string) {
    return this.settingsRepo.findOne({ where: { id, userId } });
  }

  update(id: string, userId: string, attrs: Partial<GeneratorSettings>) {
    return this.settingsRepo.update({ id, userId }, attrs);
  }

  delete(id: string, userId: string) {
    return this.settingsRepo.delete({ id, userId });
  }
}