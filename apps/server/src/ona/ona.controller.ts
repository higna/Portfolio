import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  Param,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { OnaService, ExportOptions } from './ona.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync, createReadStream } from 'fs';

function safeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_\-\. ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

@Controller('ona')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnaController {
  private readonly logger = new Logger(OnaController.name);

  constructor(
    private readonly onaService: OnaService,
    private readonly configService: ConfigService,
  ) {}

  @Get('forms')
  @Roles(UserRole.SUPERADMIN)
  async getForms() {
    return this.onaService.listForms();
  }

  @Post('download')
  @Roles(UserRole.SUPERADMIN)
  async downloadForms(
    @Body() body: { formIds: number[]; options?: ExportOptions },
    @Res() res: Response,
  ) {
    const { formIds, options = {} } = body;
    if (!formIds || formIds.length === 0) {
      return res.status(400).json({ message: 'No form IDs provided' });
    }

    const allForms = await this.onaService.listForms();
    const nameMap = new Map<number, string>();
    for (const form of allForms) {
      const rawName = form.title || form.id_string || String(form.formid);
      nameMap.set(form.formid, safeFileName(rawName));
    }

    if (formIds.length === 1) {
      const formName = nameMap.get(formIds[0]) || String(formIds[0]);
      const result = await this.onaService.downloadSingleForm(
        formIds[0],
        options,
        formName,
      );
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.fileName}"`,
      );
      res.send(result.data);
    } else {
      const { zipBuffer, zipFileName } =
        await this.onaService.downloadFormsZip(formIds, options, nameMap);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${zipFileName}"`,
      );
      res.send(zipBuffer);
    }
  }

  @Get('template/:formId')
  @Roles(UserRole.SUPERADMIN)
  async downloadTemplate(
    @Param('formId') formId: string,
    @Res() res: Response,
  ) {
    const apiKey = this.configService.get<string>('ONA_API_KEY') || '';
    const baseUrl = this.configService.get<string>(
      'ONA_BASE_URL',
      'https://api.ona.io/api/v1',
    );
    const scriptPath = join(
      process.cwd(),
      'worker',
      'scripts',
      'generate_form_template.py',
    );
    const outputPath = join(tmpdir(), `template_${formId}.xlsx`);

    // Pass Seed Tracker credentials so the script can log in
    const env = {
      ...process.env,
      SEEDTRACKER_URL: 'https://data.seedtracker.org',
      SEEDTRACKER_USERNAME:
        this.configService.get<string>('SEEDTRACKER_USERNAME') || '',
      SEEDTRACKER_PASSWORD:
        this.configService.get<string>('SEEDTRACKER_PASSWORD') || '',
    };

    const proc = spawn(
      'python',
      [scriptPath, apiKey, baseUrl, formId, outputPath],
      { env },
    );

    let stderr = '';

    proc.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          this.logger.log(
            `Template: ${msg.step} - ${msg.status} - ${msg.message}`,
          );
        } catch {
          this.logger.log(`Template Python: ${line}`);
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        this.logger.log(`Template Python stderr: ${msg}`);
        stderr += msg + '\n';
      }
    });

    proc.on('close', (code) => {
      if (code !== 0 || !existsSync(outputPath)) {
        this.logger.error(`Template generation failed: ${stderr}`);
        return res
          .status(500)
          .json({ message: 'Template generation failed', detail: stderr });
      }
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="template_${formId}.xlsx"`,
      );
      const readStream = createReadStream(outputPath);
      readStream.pipe(res);
      readStream.on('end', () => {
        try {
          unlinkSync(outputPath);
        } catch {}
      });
    });

    proc.on('error', (err) => {
      this.logger.error(`Failed to spawn Python process: ${err.message}`);
      return res.status(500).json({ message: 'Internal error' });
    });
  }
}