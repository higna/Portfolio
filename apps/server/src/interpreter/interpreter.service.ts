import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync } from 'fs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class InterpreterService {
  async interpret(fileBuffer: Buffer, originalName: string): Promise<string> {
    const workDir = join(tmpdir(), `interpreter-${uuid()}`);
    mkdirSync(workDir, { recursive: true });
    const imagePath = join(workDir, originalName);
    writeFileSync(imagePath, fileBuffer);

    const scriptPath = join(process.cwd(), 'worker', 'scripts', 'interpreter', 'interpret.py');

    return new Promise((resolve, reject) => {
      const proc = spawn('python', [scriptPath, imagePath]);
      let output = '';
      let err = '';

      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { err += data.toString(); });

      proc.on('close', (code) => {
        // Cleanup
        try { unlinkSync(imagePath); rmdirSync(workDir, { recursive: true }); } catch {}

        if (code !== 0) {
          try {
            const parsed = JSON.parse(output);
            reject(new InternalServerErrorException(parsed.error || 'Decode failed'));
          } catch {
            reject(new InternalServerErrorException(err || 'Decode failed'));
          }
          return;
        }

        try {
          const parsed = JSON.parse(output);
          if (parsed.error) {
            reject(new InternalServerErrorException(parsed.error));
          } else {
            resolve(parsed.data);
          }
        } catch {
          reject(new InternalServerErrorException('Invalid response from interpreter script'));
        }
      });
    });
  }
}