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
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeneratorSettingsService } from './generator-settings.service';

@Controller('generator-settings')
@UseGuards(JwtAuthGuard)
export class GeneratorSettingsController {
    constructor(private readonly settingsService: GeneratorSettingsService) { }

    @Post()
    async create(@Body() body: { name: string; settings: any }, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.settingsService.create({ ...body, userId });
    }

    @Get()
    async list(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.settingsService.findAllByUser(userId);
    }

    @Get(':id')
    async get(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.settingsService.findOne(id, userId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
        const userId = (req as any).user.id;
        await this.settingsService.update(id, userId, body);
        return this.settingsService.findOne(id, userId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        await this.settingsService.delete(id, userId);
        return { success: true };
    }
}