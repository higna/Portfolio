import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { join } from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';

export interface ExportOptions {
  fileType?: string;
  removeGroupName?: boolean;
  doNotSplitMultiSelects?: boolean;
  includeImages?: boolean;
  includeLabels?: boolean;
  labelsOnly?: boolean;
  includeReviews?: boolean;
  binarySelectMultiples?: boolean;
  valueSelectMultiples?: boolean;
  showChoiceLabels?: boolean;
  groupDelimiter?: string;
  dateFrom?: string;
  dateTo?: string;
  version?: string;
  zipFileName?: string;
}

@Injectable()
export class OnaService {
  private readonly logger = new Logger(OnaService.name);

  constructor(private readonly configService: ConfigService) {}

  /* ------------------------------------------------------------------ */
  /*  List forms via the Python script                                   */
  /* ------------------------------------------------------------------ */
  async listForms(): Promise<any[]> {
    const apiKey = this.configService.get<string>('ONA_API_KEY');
    const baseUrl = this.configService.get<string>('ONA_BASE_URL', 'https://api.ona.io/api/v1');
    if (!apiKey) throw new InternalServerErrorException('ONA_API_KEY not configured');

    return new Promise((resolve, reject) => {
      const scriptPath = join(__dirname, '..', 'worker', 'scripts', 'list_ona_forms.py');
      const pythonProcess = spawn('python', [scriptPath, apiKey, baseUrl]);
      let output = '', errorOutput = '';

      pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script failed: ${errorOutput}`);
          return reject(new InternalServerErrorException('Failed to fetch ONA forms'));
        }
        try {
          const result = JSON.parse(output);
          if (result.error) reject(new InternalServerErrorException(result.error));
          else resolve(result);
        } catch {
          reject(new InternalServerErrorException('Invalid response from Python script'));
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Build query string – always send every boolean explicitly         */
  /* ------------------------------------------------------------------ */
  private buildExportQuery(options: ExportOptions): string {
    const params = new URLSearchParams();

    // Boolean flags (all sent explicitly)
    const booleans: Record<string, boolean | undefined> = {
      remove_group_name: options.removeGroupName,
      include_images: options.includeImages,
      include_labels: options.includeLabels,
      labels_only: options.labelsOnly,
      include_reviews: options.includeReviews,
      binary_select_multiples: options.binarySelectMultiples,
      value_select_multiples: options.valueSelectMultiples,
      show_choice_labels: options.showChoiceLabels,
    };

    for (const [key, value] of Object.entries(booleans)) {
      if (value !== undefined) {
        params.append(key, value ? 'true' : 'false');
      }
    }

    // Prevent splitting – send both parameter names for compatibility
    const doNotSplit = options.doNotSplitMultiSelects ?? true;
    params.append('do_not_split_multi_selects', doNotSplit ? 'true' : 'false');
    params.append('do_not_split_select_multiples', doNotSplit ? 'true' : 'false');

    if (options.groupDelimiter) params.append('group_delimiter', options.groupDelimiter);
    if (options.version) params.append('version', options.version);

    // Date filter
    if (options.dateFrom || options.dateTo) {
      const query: any = {};
      if (options.dateFrom) query._submission_time = { $gte: options.dateFrom };
      if (options.dateTo) query._submission_time = { ...query._submission_time, $lte: options.dateTo };
      params.append('query', JSON.stringify(query));
    }

    return params.toString();
  }

  /* ------------------------------------------------------------------ */
  /*  Single form download                                               */
  /* ------------------------------------------------------------------ */
  async downloadSingleForm(
    formId: number,
    options: ExportOptions,
    baseName?: string,
  ): Promise<{ data: Buffer; fileName: string; contentType: string }> {
    const apiKey = this.configService.get<string>('ONA_API_KEY');
    const baseUrl = this.configService.get<string>('ONA_BASE_URL', 'https://api.ona.io/api/v1');
    if (!apiKey) throw new InternalServerErrorException('ONA_API_KEY not configured');

    const fileType = options.fileType || 'csv';
    const extensionMap: Record<string, string> = {
      csv: 'csv', 'windows-compatible-csv': 'csv', xlsx: 'xlsx',
      json: 'json', savzip: 'sav', kml: 'kml', csvzip: 'zip',
    };
    const extension = extensionMap[fileType] || 'csv';
    const contentTypeMap: Record<string, string> = {
      csv: 'text/csv', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json', zip: 'application/zip', sav: 'application/octet-stream',
      kml: 'application/vnd.google-earth.kml+xml',
    };

    const queryString = this.buildExportQuery(options);
    const url = `${baseUrl}/data/${formId}.${fileType === 'xlsx' ? 'xlsx' : fileType === 'json' ? 'json' : 'csv'}?${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${apiKey}` },
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      const fileName = baseName ? `${baseName}.${extension}` : `${formId}.${extension}`;
      return {
        data: Buffer.from(response.data),
        fileName,
        contentType: contentTypeMap[extension] || 'application/octet-stream',
      };
    } catch (error: any) {
      this.logger.error(`Failed to download form ${formId}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to download form ${formId}`);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Multiple forms → ZIP using names from map + custom ZIP filename   */
  /* ------------------------------------------------------------------ */
  async downloadFormsZip(
    formIds: number[],
    options: ExportOptions,
    nameMap?: Map<number, string>,
  ): Promise<{ zipBuffer: Buffer; zipFileName: string }> {
    const zip = new AdmZip();

    for (const formId of formIds) {
      try {
        const baseName = nameMap?.get(formId) || String(formId);
        const result = await this.downloadSingleForm(formId, options, baseName);
        zip.addFile(result.fileName, result.data);
        this.logger.log(`Added form ${baseName} to ZIP`);
      } catch (err: any) {
        this.logger.error(`Failed to add form ${formId} to ZIP: ${err.message}`);
      }
    }

    const zipFileName = options.zipFileName
      ? `${options.zipFileName}.zip`
      : 'ona-data.zip';

    return { zipBuffer: zip.toBuffer(), zipFileName };
  }
}