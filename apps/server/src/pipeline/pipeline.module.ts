import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../common/events/events.module';

@Module({
  imports: [NotificationsModule, EventsModule],
  controllers: [PipelineController],
  providers: [PipelineService],
})
export class PipelineModule {}