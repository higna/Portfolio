import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { CampaignService } from './campaign.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('campaign')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  /* Upload a flyer image to Cloudinary (campaign folder) */
  @Post('upload-flyer')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFlyer(@UploadedFile() file: any) {
    if (!file) throw new Error('No file uploaded');
    const url = await this.cloudinaryService.uploadCampaignImage(
      file.buffer,
      file.originalname.split('.')[0],
    );
    return { url };
  }

  /* Create a new template */
  @Post('template')
  @UseGuards(JwtAuthGuard)
  async createTemplate(
    @Body() body: { title: string; flyerUrl: string; photoBox: any; nameConfig: any },
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.campaignService.create({ ...body, userId });
  }

  /* List templates for the current user */
  @Get('templates')
  @UseGuards(JwtAuthGuard)
  async listTemplates(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.campaignService.findAllByUser(userId);
  }

  /* Get a single template (public – guests can view) */
  @Get('template/:id')
  async getTemplate(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Put('template/:id')
  @UseGuards(JwtAuthGuard)
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { title?: string; flyerUrl?: string; photoBox?: any; nameConfig?: any },
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.campaignService.update(id, userId, body);
  }

  /* Delete a template */
  @Delete('template/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTemplate(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.campaignService.delete(id, userId);
  }
}