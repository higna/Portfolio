import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

/*
 * Extracts Cloudinary public_id from a secure URL robustly.
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 1);
    if (afterUpload.length > 0 && /^v\d+$/.test(afterUpload[0])) {
      afterUpload.shift();
    }
    if (afterUpload.length === 0) return null;
    const last = afterUpload[afterUpload.length - 1];
    afterUpload[afterUpload.length - 1] = last.replace(/\.[^/.]+$/, '');
    return afterUpload.join('/');
  } catch {
    return null;
  }
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() attrs: Record<string, any>,
  ) {
    const currentUser = await this.usersService.findById(user.id);
    if (!currentUser) throw new BadRequestException('User not found');

    const allowed = ['fullName', 'picture'];
    const filtered: Record<string, any> = {};
    for (const key of allowed) {
      if (attrs[key] !== undefined) filtered[key] = attrs[key];
    }

    // Delete old avatar from Cloudinary if a new picture is provided
    if (
      filtered.picture &&
      currentUser.picture &&
      filtered.picture !== currentUser.picture
    ) {
      const oldPublicId = extractCloudinaryPublicId(currentUser.picture);
      if (oldPublicId) {
        await this.cloudinaryService.deleteImage(oldPublicId).catch(() => {});
      }
    }

    return this.usersService.update(user.id, filtered);
  }

  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const currentUser = await this.usersService.findById(user.id);
    if (!currentUser || !currentUser.password) {
      throw new BadRequestException('Cannot change password');
    }
    const isValid = await bcrypt.compare(body.currentPassword, currentUser.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');
    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.usersService.updatePassword(user.id, hashed);
    return { message: 'Password changed successfully' };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@CurrentUser() user: { id: string }) {
    await this.usersService.remove(user.id);
    return { message: 'Account deleted' };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted' };
  }

  @Put(':id/password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async adminResetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.usersService.updatePassword(id, hashed);
    return { message: 'Password reset successfully' };
  }
}