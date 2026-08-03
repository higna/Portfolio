import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { Readable } from 'stream';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private readonly pipelinesDir: string;
  private readonly configDir: string;

  constructor(private readonly configService: ConfigService) {
    this.pipelinesDir = join(__dirname, '..', 'worker', 'scripts', 'pipelines');
    this.configDir = join(__dirname, '..', 'worker', 'config');
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
    const credsJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');

    if (!apiKey || !credsJson) {
      throw new Error('Missing required configuration');
    }

    // Write credentials to a temporary file
    const tempCredsPath = join(tmpdir(), `gcp-creds-${Date.now()}.json`);
    writeFileSync(tempCredsPath, credsJson, 'utf-8');

    // *** ORDER MATTERS – must match what the Python script expects ***
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

    const pythonProcess = spawn('python', args);
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

    pythonProcess.on('close', (code) => {
      try { unlinkSync(tempCredsPath); } catch { }
      if (code !== 0) {
        this.logger.error(`Pipeline script exited with code ${code}`);
        stdoutStream.push(
          JSON.stringify({ step: 'error', status: 'failed', message: 'Pipeline execution failed' }) + '\n',
        );
      }
      stdoutStream.push(null);
    });

    pythonProcess.on('error', (err) => {
      try { unlinkSync(tempCredsPath); } catch { }
      this.logger.error(`Failed to spawn Python process: ${err.message}`);
      stdoutStream.destroy(err);
    });

    return stdoutStream;
  }
}