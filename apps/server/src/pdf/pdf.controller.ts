import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import type { Response } from 'express';
import { createReadStream, unlinkSync, rmdirSync } from 'fs';
import { dirname } from 'path';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('merge')
  @UseInterceptors(FilesInterceptor('files', 20, { limits: { fileSize: 50 * 1024 * 1024 } }))
  async mergePdfs(
    @UploadedFiles() files: any[],
    @Res() res: Response,
  ) {
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const mergedPath = await this.pdfService.mergePdfs(files);
    const readStream = createReadStream(mergedPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    readStream.pipe(res);

    readStream.on('end', () => {
      try {
        const dir = dirname(mergedPath);
        unlinkSync(mergedPath);
        rmdirSync(dir, { recursive: true });
      } catch {}
    });
  }

  @Post('images-to-pdf')
  @UseInterceptors(FilesInterceptor('files', 20, { limits: { fileSize: 20 * 1024 * 1024 } }))
  async imagesToPdf(
    @UploadedFiles() files: any[],
    @Res() res: Response,
  ) {
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const convertedPath = await this.pdfService.convertImagesToPdf(files);
    const readStream = createReadStream(convertedPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    readStream.pipe(res);

    readStream.on('end', () => {
      try {
        const dir = dirname(convertedPath);
        unlinkSync(convertedPath);
        rmdirSync(dir, { recursive: true });
      } catch {}
    });
  }
}