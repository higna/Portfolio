import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterpreterService } from './interpreter.service';

@Controller('interpreter')
export class InterpreterController {
  constructor(private readonly interpreterService: InterpreterService) {}

  @Post('interpret')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async interpret(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No image uploaded');
    const data = await this.interpreterService.interpret(file.buffer, file.originalname);
    return { data };
  }
}