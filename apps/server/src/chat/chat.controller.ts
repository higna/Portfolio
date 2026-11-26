import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Delete,
  Param,
  Put,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { TailoredDocumentKind } from './entities/tailored-document.entity';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('tailor-cv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async tailorCv(@Body() body: { jobDescription?: unknown; candidateName?: unknown; template?: unknown } | null) {
    const { jobDescription, candidateName, template } = this.validateGenerationInput(body);
    return this.chatService.tailorCv(jobDescription, candidateName, template);
  }

  @Post('tailor-cover-letter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async generateCoverLetter(@Body() body: { jobDescription?: unknown; candidateName?: unknown; template?: unknown } | null) {
    const { jobDescription, candidateName, template } = this.validateGenerationInput(body);
    return this.chatService.generateCoverLetter(jobDescription, candidateName, template);
  }

  @Get('tailored-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  listTailoredDocuments(@Req() req: Request) {
    return this.chatService.listTailoredDocuments((req as any).user.id);
  }

  @Post('tailored-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  saveTailoredDocument(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const input = this.validateSavedDocument(body);
    return this.chatService.saveTailoredDocument((req as any).user.id, input);
  }

  @Put('tailored-documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  updateTailoredDocument(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const input = this.validateSavedDocument(body);
    return this.chatService.saveTailoredDocument((req as any).user.id, input, id);
  }

  @Delete('tailored-documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteTailoredDocument(@Req() req: Request, @Param('id') id: string) {
    await this.chatService.deleteTailoredDocument((req as any).user.id, id);
    return { message: 'Saved document deleted' };
  }

  @Post('tailored-documents/:id/revise')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async reviseTailoredDocument(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { instruction?: unknown } | null,
  ) {
    const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : '';
    if (!instruction || instruction.length > 5000) {
      throw new BadRequestException('Enter a revision request of up to 5,000 characters.');
    }
    return this.chatService.reviseTailoredDocument((req as any).user.id, id, instruction);
  }

  @Get('tailored-documents/:id/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async downloadTailoredDocumentPdf(
    @Req() req: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.chatService.compileTailoredDocumentPdf((req as any).user.id, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="tailored-document.pdf"');
    res.setHeader('Content-Length', pdf.length);
    return res.send(pdf);
  }

  private validateGenerationInput(
    body: { jobDescription?: unknown; candidateName?: unknown; template?: unknown } | null,
  ): { jobDescription: string; candidateName: string; template: 'ats' | 'modern' | 'classic' } {
    if (
      typeof body?.jobDescription !== 'string' ||
      !body.jobDescription.trim() ||
      body.jobDescription.length > 20000
    ) {
      throw new BadRequestException(
        'Enter a role or job description of up to 20,000 characters.',
      );
    }
    if (
      typeof body.candidateName !== 'string' ||
      !body.candidateName.trim() ||
      body.candidateName.trim().length > 160
    ) {
      throw new BadRequestException('Candidate name is required and must be 160 characters or fewer.');
    }
    const allowedTemplates = ['ats', 'modern', 'classic'] as const;
    const template = allowedTemplates.includes(body.template as (typeof allowedTemplates)[number])
      ? (body.template as (typeof allowedTemplates)[number])
      : 'ats';
    return {
      jobDescription: body.jobDescription.trim(),
      candidateName: body.candidateName.trim(),
      template,
    };
  }

  private validateSavedDocument(body: Record<string, unknown>) {
    const kinds: TailoredDocumentKind[] = ['cv', 'cover-letter'];
    if (!kinds.includes(body.kind as TailoredDocumentKind)) {
      throw new BadRequestException('Document type must be cv or cover-letter.');
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const candidateName = typeof body.candidateName === 'string' ? body.candidateName.trim() : '';
    const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!title || title.length > 200) throw new BadRequestException('Document title is required.');
    if (!candidateName || candidateName.length > 160) throw new BadRequestException('Candidate name is required.');
    if (!jobDescription || jobDescription.length > 20000) {
      throw new BadRequestException('Enter a role or job description of up to 20,000 characters.');
    }
    if (!content || content.length > 100000) throw new BadRequestException('Document content is required.');
    const template = typeof body.template === 'string' ? body.template : null;
    return {
      kind: body.kind as TailoredDocumentKind,
      title,
      candidateName,
      jobDescription,
      template,
      content,
    };
  }

  @Post('message')
  @UseGuards(OptionalJwtAuthGuard)
  async sendMessage(
    @Body() body: { message: string; conversationId?: string },
    @Req() req: Request,
  ) {
    let userId: string | undefined;
    if ((req as any).user) {
      userId = (req as any).user.id;
    }
    const convId = body.conversationId || this.chatService.createConversationId();
    return this.chatService.sendMessage(body.message, convId, userId);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.chatService.getConversations(userId);
  }

  @Get('history/:conversationId')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = (req as any).user.id;
    return this.chatService.getHistory(userId, conversationId);
  }

  @Delete('conversations/:conversationId')
  @UseGuards(JwtAuthGuard)
  async deleteConversation(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = (req as any).user.id;
    await this.chatService.deleteConversation(conversationId, userId);
    return { message: 'Conversation deleted' };
  }
}
