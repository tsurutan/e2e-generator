import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Prisma } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectWithFeatureCount } from './dto/project-with-feature-count.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<ProjectWithFeatureCount[]> {
    // プロジェクト一覧を取得
    const projects = await this.prisma.project.findMany();

    // 各プロジェクトの機能数を取得
    const projectsWithFeatureCount = await Promise.all(
      projects.map(async (project) => {
        const featureCount = await this.prisma.feature.count({
          where: { projectId: project.id },
        });

        return {
          ...project,
          featureCount,
        };
      })
    );

    return projectsWithFeatureCount;
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    try {
      return await this.prisma.project.update({
        where: { id },
        data: updateProjectDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      throw error;
    }
  }
}
