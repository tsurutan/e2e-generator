import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UiState, Prisma } from '@prisma/client';
import { CreateUiStateDto, UpdateUiStateDto } from './dto/ui-state.dto';

@Injectable()
export class UiStatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UiState[]> {
    return this.prisma.uiState.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findByProject(projectId: string): Promise<UiState[]> {
    return this.prisma.uiState.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findByPage(projectId: string, pageUrl: string): Promise<UiState[]> {
    return this.prisma.uiState.findMany({
      where: { 
        projectId,
        pageUrl 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string): Promise<UiState> {
    const uiState = await this.prisma.uiState.findUnique({
      where: { id },
      include: {
        project: true,
        page: true,
        fromEdges: true,
        toEdges: true,
        Label: true
      }
    });
    
    if (!uiState) {
      throw new NotFoundException(`UiState with ID ${id} not found`);
    }
    
    return uiState;
  }

  async create(createUiStateDto: CreateUiStateDto): Promise<UiState> {
    const { projectId, pageUrl, isDefault, ...rest } = createUiStateDto;

    // プロジェクトが存在するかチェック
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // ページが存在するかチェック
    const page = await this.prisma.page.findUnique({
      where: { 
        projectId_url: {
          projectId,
          url: pageUrl
        }
      }
    });
    
    if (!page) {
      throw new NotFoundException(`Page with URL ${pageUrl} not found in project ${projectId}`);
    }

    // isDefaultがtrueの場合、同じページの他のUIStateのisDefaultをfalseにする
    if (isDefault) {
      const existingDefaultUiState = await this.prisma.uiState.findFirst({
        where: {
          projectId,
          pageUrl,
          isDefault: true
        }
      });

      if (existingDefaultUiState) {
        throw new BadRequestException(`Default UiState already exists for page ${pageUrl} in project ${projectId}`);
      }
    }

    return this.prisma.uiState.create({
      data: {
        ...rest,
        projectId,
        pageUrl,
        isDefault: isDefault || false
      }
    });
  }

  async update(id: string, updateUiStateDto: UpdateUiStateDto): Promise<UiState> {
    const { isDefault, pageUrl, ...rest } = updateUiStateDto;

    // UIStateが存在するかチェック
    const existingUiState = await this.prisma.uiState.findUnique({
      where: { id }
    });

    if (!existingUiState) {
      throw new NotFoundException(`UiState with ID ${id} not found`);
    }

    // isDefaultがtrueに変更される場合、同じページの他のUIStateのisDefaultをfalseにする
    if (isDefault === true) {
      const targetPageUrl = pageUrl || existingUiState.pageUrl;
      const existingDefaultUiState = await this.prisma.uiState.findFirst({
        where: {
          projectId: existingUiState.projectId,
          pageUrl: targetPageUrl,
          isDefault: true,
          id: { not: id } // 自分以外
        }
      });

      if (existingDefaultUiState) {
        throw new BadRequestException(`Default UiState already exists for page ${targetPageUrl}`);
      }
    }

    try {
      return await this.prisma.uiState.update({
        where: { id },
        data: {
          ...rest,
          ...(pageUrl && { pageUrl }),
          ...(isDefault !== undefined && { isDefault })
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`UiState with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.uiState.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`UiState with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getDefaultUiState(projectId: string, pageUrl: string): Promise<UiState | null> {
    return this.prisma.uiState.findFirst({
      where: {
        projectId,
        pageUrl,
        isDefault: true
      }
    });
  }
}
