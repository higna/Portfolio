import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, rmdirSync, existsSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class PdfService {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  async mergePdfs(files: any[]): Promise<string> {
    const workDir = join(tmpdir(), `pdf-merge-${uuid()}`);
    mkdirSync(workDir, { recursive: true });

    for (const file of files) {
      writeFileSync(join(workDir, file.originalname), file.buffer);
    }

    const outputPath = join(workDir, 'merged.pdf');
    const scriptPath = join(process.cwd(), 'worker', 'scripts', 'pdf', 'merge_pdfs.py');

    return new Promise((resolve, reject) => {
      const proc = spawn('python', [scriptPath, workDir, outputPath]);
      let err = '';

      proc.stderr.on('data', (data) => {
        err += data.toString();
      });

      proc.on('close', (code) => {
        // Clean up input files
        try {
          const files = readdirSync(workDir);
          for (const f of files) {
            if (f !== 'merged.pdf') unlinkSync(join(workDir, f));
          }
        } catch {}

        if (code !== 0 || !existsSync(outputPath)) {
          try { rmdirSync(workDir, { recursive: true }); } catch {}
          reject(new InternalServerErrorException(err || 'PDF merge failed'));
        } else {
          // Notify superadmin
          this.notificationsService.createNotification({
            role: UserRole.SUPERADMIN,
            type: NotificationType.SUCCESS,
            title: 'PDF Merger Used',
            message: `A user merged ${files.length} PDF files.`,
          }).catch(() => {});
          resolve(outputPath);
        }
      });
    });
  }

  async convertImagesToPdf(files: any[]): Promise<string> {
    const workDir = join(tmpdir(), `img-to-pdf-${uuid()}`);
    mkdirSync(workDir, { recursive: true });

    for (const file of files) {
      writeFileSync(join(workDir, file.originalname), file.buffer);
    }

    const outputPath = join(workDir, 'converted.pdf');
    const scriptPath = join(process.cwd(), 'worker', 'scripts', 'pdf', 'convert_images_to_pdf.py');

    return new Promise((resolve, reject) => {
      const proc = spawn('python', [scriptPath, workDir, outputPath]);
      let err = '';

      proc.stderr.on('data', (data) => {
        err += data.toString();
      });

      proc.on('close', (code) => {
        // Clean up input files
        try {
          const files = readdirSync(workDir);
          for (const f of files) {
            if (f !== 'converted.pdf') unlinkSync(join(workDir, f));
          }
        } catch {}

        if (code !== 0 || !existsSync(outputPath)) {
          try { rmdirSync(workDir, { recursive: true }); } catch {}
          reject(new InternalServerErrorException(err || 'Image conversion failed'));
        } else {
          // Notify superadmin
          this.notificationsService.createNotification({
            role: UserRole.SUPERADMIN,
            type: NotificationType.SUCCESS,
            title: 'Image to PDF Used',
            message: `A user converted ${files.length} images to PDF.`,
          }).catch(() => {});
          resolve(outputPath);
        }
      });
    });
  }
}