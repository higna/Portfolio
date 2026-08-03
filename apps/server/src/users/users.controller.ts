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
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /* Get current user profile */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    async getProfile(@CurrentUser() user: { id: string }) {
        return this.usersService.findById(user.id);
    }

    /* Update current user profile (name, picture) */
    @Put('me')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    async updateProfile(
        @CurrentUser() user: { id: string },
        @Body() attrs: Record<string, any>,
    ) {
        const allowed = ['fullName', 'picture'];
        const filtered: Record<string, any> = {};
        for (const key of allowed) {
            if (attrs[key] !== undefined) filtered[key] = attrs[key];
        }
        return this.usersService.update(user.id, filtered);
    }

    /* Change current user password */
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
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }
        const hashed = await bcrypt.hash(body.newPassword, 10);
        await this.usersService.updatePassword(user.id, hashed);
        return { message: 'Password changed successfully' };
    }

    /* Delete current user account */
    @Delete('me')
    @UseGuards(JwtAuthGuard)
    async deleteProfile(@CurrentUser() user: { id: string }) {
        await this.usersService.remove(user.id);
        return { message: 'Account deleted' };
    }

    /* Admin: get all users */
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    async getAllUsers() {
        return this.usersService.findAll();
    }

    /* Admin: get single user */
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    async getUserById(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    /* Admin: delete a user */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    async deleteUser(@Param('id') id: string) {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted' };
    }

    /* Admin: reset a user's password */
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