import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScenariosModule } from '../scenarios/scenarios.module';

@Module({
  imports: [PrismaModule, ScenariosModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
