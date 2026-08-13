import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PublicGuard } from '../common/guards/public.guard';
import { UserRole } from '../users/entities/user.entity';
import { join } from 'path';
import { createReadStream, existsSync, rmdirSync } from 'fs';

const archiver = require('archiver');

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post('run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async runPipeline(
    @Body()
    body: {
      scriptName: string;
      formId: string;
      sheetName: string;
      spreadsheetKey: string;
      generateCharts?: boolean;
    },
    @Res() res: Response,
  ) {
    const stream = this.pipelineService.runPipeline(
      body.scriptName,
      body.formId,
      body.sheetName,
      body.spreadsheetKey,
      body.generateCharts ?? false,
    );
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    stream.pipe(res);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async getStatuses() {
    return this.pipelineService.getLastRunStatuses();
  }

  @Get('download-cocoa-eval')
  @UseGuards(PublicGuard) // overrides class‑level guards – anyone can access
  async downloadCocoaEvalCharts(@Res() res: Response) {
    const outputDir = join(process.cwd(), 'worker', 'output', 'cocoa_eval');
    if (!existsSync(outputDir)) {
      return res.status(404).json({ message: 'No charts available' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="cocoa_eval_charts.zip"',
    );

    archive.on('end', () => {
      try {
        rmdirSync(outputDir, { recursive: true });
      } catch {}
    });

    archive.pipe(res);
    archive.directory(outputDir, false);
    archive.finalize();
  }
}