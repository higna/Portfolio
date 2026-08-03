import { Module } from '@nestjs/common';
import { OnaService } from './ona.service';
import { OnaController } from './ona.controller';

@Module({
    controllers: [OnaController],
    providers: [OnaService],
})
export class OnaModule { }