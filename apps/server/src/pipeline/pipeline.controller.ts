import { Controller, Post, Body, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { rmdirSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import AdmZip from 'adm-zip';

@Controller('pipeline')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) { }

  @Post('run')
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

  @Get('download-cocoa-eval')
  async downloadCocoaEvalCharts(@Res() res: Response) {
    const outputDir = join(process.cwd(), 'worker', 'output', 'cocoa_eval');
    if (!existsSync(outputDir)) {
      return res.status(404).json({ message: 'No charts available' });
    }

    const zip = new AdmZip();
    zip.addLocalFolder(outputDir);
    const zipBuffer = zip.toBuffer();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Cocoa Evaluation Charts.zip"');
    res.send(zipBuffer);

    try { rmdirSync(outputDir, { recursive: true }); } catch { }
  }
}