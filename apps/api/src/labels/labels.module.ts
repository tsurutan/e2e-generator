import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {LabelsRouter} from 'src/labels/labels.router';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [LabelsController],
  providers: [LabelsService, PrismaService, LabelsRouter],
  exports: [LabelsService],
})
export class LabelsModule {}
