import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignTemplate } from './campaign-template.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(CampaignTemplate)
    private readonly templateRepo: Repository<CampaignTemplate>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(data: {
    title: string;
    flyerUrl: string;
    photoBox: any;
    nameConfig: any;
    userId: string;
  }) {
    const template = this.templateRepo.create(data);
    return this.templateRepo.save(template);
  }

  async findById(id: string) {
    return this.templateRepo.findOne({ where: { id } });
  }

  async findAllByUser(userId: string) {
    return this.templateRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async update(id: string, userId: string, data: Partial<CampaignTemplate>) {
    await this.templateRepo.update({ id, userId }, data);
    return this.templateRepo.findOne({ where: { id } });
  }

  async delete(id: string, userId: string) {
    const template = await this.templateRepo.findOne({ where: { id, userId } });
    if (!template) {
      throw new Error('Template not found');
    }

    const publicId = this.extractCloudinaryPublicId(template.flyerUrl);
    if (publicId) {
      try {
        await this.cloudinaryService.deleteImage(publicId);
        this.logger.log(`Deleted flyer image ${publicId}`);
      } catch (error: any) {
        this.logger.error(`Failed to delete flyer image ${publicId}: ${error.message}`);
      }
    }

    await this.templateRepo.delete({ id, userId });
    return { success: true };
  }
  
  private extractCloudinaryPublicId(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  }
}