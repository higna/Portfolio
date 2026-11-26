import { randomUUID } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';

export function getCvDataFilePath(): string {
  return join(process.cwd(), 'src', 'chat', 'data', 'cv-data.json');
}

export function cvDataFileExists(): boolean {
  return existsSync(getCvDataFilePath());
}

export function readCvDataFile(): unknown {
  return JSON.parse(readFileSync(getCvDataFilePath(), 'utf-8')) as unknown;
}

export function writeCvDataFile(data: unknown): void {
  const filePath = getCvDataFilePath();
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  const contents = JSON.stringify(data, null, 2);
  if (contents === undefined) {
    throw new TypeError('CV data cannot be serialized as JSON');
  }

  mkdirSync(dirname(filePath), { recursive: true });
  try {
    writeFileSync(temporaryPath, `${contents}\n`, 'utf-8');
    renameSync(temporaryPath, filePath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}
