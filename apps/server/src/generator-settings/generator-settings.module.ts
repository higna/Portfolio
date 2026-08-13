import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratorSetting } from './generator-settings.entity';
import { GeneratorSettingsService } from './generator-settings.service';
import { GeneratorSettingsController } from './generator-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GeneratorSetting])],
  controllers: [GeneratorSettingsController],
  providers: [GeneratorSettingsService],
})
export class GeneratorSettingsModule {}