import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EventsService } from '../common/events/events.service';
import { UserRole } from '../users/entities/user.entity';
import { getPythonExecutable } from '../common/python-runtime';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private readonly pipelinesDir: string;
  private readonly configDir: string;
  private readonly lastRun = new Map<string, { status: string; time: string }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
  ) {
    this.pipelinesDir = join(process.cwd(), 'worker', 'scripts', 'pipelines');
    this.configDir = join(process.cwd(), 'worker', 'config');
  }

  runPipeline(
    scriptName: string,
    formId: string,
    sheetName: string,
    spreadsheetKey: string,
    generateCharts = false,
  ): Readable {
    if (!/^[a-zA-Z0-9_]+\.py$/.test(scriptName)) {
      throw new BadRequestException('Invalid script name');
    }

    const scriptPath = join(this.pipelinesDir, scriptName);
    if (!existsSync(scriptPath)) {
      throw new BadRequestException(`Pipeline script not found: ${scriptName}`);
    }

    const spreadsheetConfigPath = join(this.configDir, 'spreadsheets.json');
    if (!existsSync(spreadsheetConfigPath)) {
      throw new Error('spreadsheets.json configuration file not found');
    }

    const apiKey = this.configService.get<string>('ONA_API_KEY');
    const baseUrl = this.configService.get<string>('ONA_BASE_URL', 'https://api.ona.io/api/v1');
    const credsRaw = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');

    if (!apiKey || !credsRaw) {
      throw new Error('Missing required configuration');
    }

    // Parse creds and fix private key newlines
    let creds: any;
    try {
      creds = JSON.parse(credsRaw);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    if (creds.private_key) {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    const fixedJson = JSON.stringify(creds);

    const tempCredsPath = join(tmpdir(), `gcp-creds-${Date.now()}.json`);
    writeFileSync(tempCredsPath, fixedJson, 'utf-8');

    const args = [
      scriptPath,
      apiKey,
      baseUrl,
      formId,
      sheetName,
      tempCredsPath,
      spreadsheetConfigPath,
      spreadsheetKey,
      generateCharts ? 'true' : 'false',
    ];

    const pythonProcess = spawn(getPythonExecutable(), args);
    const stdoutStream = new Readable({ read() { } });

    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdoutStream.push(data);
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        this.logger.log(`Python: ${msg}`);
      }
    });

    pythonProcess.on('close', (exitCode) => {
      try { unlinkSync(tempCredsPath); } catch { }

      this.lastRun.set(scriptName, {
        status: exitCode === 0 ? 'success' : 'failed',
        time: new Date().toISOString(),
      });

      // Emit pipeline status event (for dashboard)
      this.eventsService.emit('pipeline.status', {
        scriptName,
        status: exitCode === 0 ? 'success' : 'failed',
        time: new Date().toISOString(),
      });

      // Create notification for superadmin
      this.notificationsService.createNotification({
        role: UserRole.SUPERADMIN,
        type: exitCode === 0 ? NotificationType.SUCCESS : NotificationType.ERROR,
        title: `Pipeline ${scriptName}`,
        message: exitCode === 0
          ? 'Pipeline completed successfully'
          : 'Pipeline execution failed',
      }).catch(err => this.logger.error(`Notification failed: ${err.message}`));

      if (exitCode !== 0) {
        this.logger.error(`Pipeline script exited with code ${exitCode}`);
        stdoutStream.push(
          JSON.stringify({ step: 'error', status: 'failed', message: 'Pipeline execution failed' }) + '\n',
        );
      }
      stdoutStream.push(null);
    });

    pythonProcess.on('error', (err) => {
      try { unlinkSync(tempCredsPath); } catch { }
      this.lastRun.set(scriptName, {
        status: 'failed',
        time: new Date().toISOString(),
      });
      this.logger.error(`Failed to spawn Python process: ${err.message}`);
      stdoutStream.destroy(err);
    });

    return stdoutStream;
  }

  uploadGermplasmWorkbook(workbook: Buffer): Readable {
    const scriptName = 'upload_germplasm_exchange.py';
    const scriptPath = join(this.pipelinesDir, scriptName);
    if (!existsSync(scriptPath)) {
      throw new BadRequestException(`Pipeline script not found: ${scriptName}`);
    }

    const spreadsheetConfigPath = join(this.configDir, 'spreadsheets.json');
    if (!existsSync(spreadsheetConfigPath)) {
      throw new Error('spreadsheets.json configuration file not found');
    }

    const credsRaw = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!credsRaw) throw new Error('Missing Google service account configuration');

    let creds: Record<string, unknown> & { private_key?: string };
    try {
      creds = JSON.parse(credsRaw);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    if (creds.private_key) {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }

    const tempPrefix = `germplasm-${randomUUID()}`;
    const workbookPath = join(tmpdir(), `${tempPrefix}.xlsx`);
    const tempCredsPath = join(tmpdir(), `${tempPrefix}-credentials.json`);
    writeFileSync(workbookPath, workbook);
    writeFileSync(tempCredsPath, JSON.stringify(creds), 'utf-8');

    const args = [
      scriptPath,
      workbookPath,
      tempCredsPath,
      spreadsheetConfigPath,
      'germplasm',
      'Germplasm',
    ];
    const pythonProcess = spawn(getPythonExecutable(), args);
    const stdoutStream = new Readable({ read() {} });
    const cleanup = () => {
      try { unlinkSync(workbookPath); } catch {}
      try { unlinkSync(tempCredsPath); } catch {}
    };

    pythonProcess.stdout.on('data', (data: Buffer) => stdoutStream.push(data));
    pythonProcess.stderr.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) this.logger.log(`Python: ${message}`);
    });
    pythonProcess.on('close', (exitCode) => {
      cleanup();
      const status = exitCode === 0 ? 'success' : 'failed';
      const time = new Date().toISOString();
      this.lastRun.set(scriptName, { status, time });
      this.eventsService.emit('pipeline.status', { scriptName, status, time });
      this.notificationsService.createNotification({
        role: UserRole.SUPERADMIN,
        type: exitCode === 0 ? NotificationType.SUCCESS : NotificationType.ERROR,
        title: 'Germplasm exchange upload',
        message: exitCode === 0
          ? 'Germplasm workbook uploaded successfully'
          : 'Germplasm workbook upload failed',
      }).catch((error) => this.logger.error(`Notification failed: ${error.message}`));
      if (exitCode !== 0) {
        stdoutStream.push(
          JSON.stringify({ step: 'error', status: 'failed', message: 'Germplasm upload failed' }) + '\n',
        );
      }
      stdoutStream.push(null);
    });
    pythonProcess.on('error', (error) => {
      cleanup();
      this.lastRun.set(scriptName, { status: 'failed', time: new Date().toISOString() });
      this.logger.error(`Failed to start Germplasm pipeline: ${error.message}`);
      stdoutStream.destroy(error);
    });

    return stdoutStream;
  }

  getLastRunStatuses() {
    return Object.fromEntries(this.lastRun);
  }
}
