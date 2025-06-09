import { Module } from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ProjectsRouter} from 'src/projects/projects.router';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { FeaturesModule } from '../features/features.module';

@Module({
  imports: [FeaturesModule, ConfigModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRouter],
  exports: [ProjectsService],
})
export class ProjectsModule {}
