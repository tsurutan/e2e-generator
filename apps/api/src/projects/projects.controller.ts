import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FeaturesService } from '../features/features.service';
import { FeatureDto } from '../features/dto/feature.dto';
import { ProjectWithFeatureCount } from './dto/project-with-feature-count.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly featuresService: FeaturesService,
  ) {}

  @Get()
  findAll(): Promise<ProjectWithFeatureCount[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.projectsService.remove(id);
  }

  /**
   * プロジェクトに関連する機能を取得するエンドポイント
   * @param id プロジェクトID
   * @returns 機能のリスト
   */
  @Get(':id/features')
  async getFeatures(@Param('id') id: string): Promise<FeatureDto[]> {
    return this.featuresService.getFeaturesByProjectId(id);
  }
}
