import {
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  Controller,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PortfolioService } from './portfolio.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly cloudinaryService: CloudinaryService,) { }

  /* ----- Profile ----- */
  @Get('profile')
  getProfile() {
    return this.portfolioService.getProfile();
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateProfile(@Body() body: any) {
    return this.portfolioService.updateProfile(body);
  }

  /* Education */
  @Get('educations')
  getEducations() {
    return this.portfolioService.getEducations();
  }

  @Post('educations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async addEducation(@Body() body: any) {
    return this.portfolioService.addEducation(body);
  }

  @Put('educations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateEducation(@Param('id') id: string, @Body() body: any) {
    return this.portfolioService.updateEducation(id, body);
  }

  @Delete('educations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteEducation(@Param('id') id: string) {
    return this.portfolioService.deleteEducation(id);
  }

  /* Experiences */
  @Get('experiences')
  getExperiences() {
    return this.portfolioService.getExperiences();
  }

  @Post('experiences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async addExperience(@Body() body: any) {
    return this.portfolioService.addExperience(body);
  }

  @Put('experiences/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateExperience(@Param('id') id: string, @Body() body: any) {
    return this.portfolioService.updateExperience(id, body);
  }

  @Delete('experiences/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteExperience(@Param('id') id: string) {
    return this.portfolioService.deleteExperience(id);
  }

  /* Skills */
  @Get('skills')
  getSkills() {
    return this.portfolioService.getSkills();
  }

  @Post('skills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async addSkill(@Body() body: any) {
    return this.portfolioService.addSkill(body);
  }

  @Put('skills/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateSkill(@Param('id') id: string, @Body() body: any) {
    return this.portfolioService.updateSkill(id, body);
  }

  @Delete('skills/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteSkill(@Param('id') id: string) {
    return this.portfolioService.deleteSkill(id);
  }

  /* Projects */
  @Get('projects')
  getProjects(@Query('featured') featured?: string) {
    const isFeatured = featured === 'true';
    return this.portfolioService.getProjects(isFeatured);
  }
  @Post('projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async addProject(@Body() body: any) {
    return this.portfolioService.addProject(body);
  }

  @Put('projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateProject(@Param('id') id: string, @Body() body: any) {
    return this.portfolioService.updateProject(id, body);
  }

  @Delete('projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteProject(@Param('id') id: string) {
    return this.portfolioService.deleteProject(id);
  }

  /* ----- Certification ----- */
  @Get('certifications')
  getCertifications() {
    return this.portfolioService.getCertifications();
  }

  @Post('certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async addCertification(@Body() body: any) {
    return this.portfolioService.addCertification(body);
  }

  @Put('certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateCertification(@Param('id') id: string, @Body() body: any) {
    return this.portfolioService.updateCertification(id, body);
  }

  @Delete('certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteCertification(@Param('id') id: string) {
    return this.portfolioService.deleteCertification(id);
  }

  @Post('upload-project-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProjectImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.cloudinaryService.uploadProjectImage(
      file.buffer,
      file.originalname.split('.')[0],
    );
    return { url };
  }
}