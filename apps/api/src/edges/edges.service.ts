import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Edge, Prisma } from '@prisma/client';
import { CreateEdgeDto, UpdateEdgeDto, EdgeDto } from './dto';

@Injectable()
export class EdgesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Edge[]> {
    return this.prisma.edge.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        fromUIState: true,
        toUIState: true,
        project: true
      }
    });
  }

  async findByProject(projectId: string): Promise<Edge[]> {
    return this.prisma.edge.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        fromUIState: true,
        toUIState: true,
        project: true
      }
    });
  }

  async findOne(id: string): Promise<Edge> {
    const edge = await this.prisma.edge.findUnique({
      where: { id },
      include: {
        fromUIState: true,
        toUIState: true,
        project: true
      }
    });
    
    if (!edge) {
      throw new NotFoundException(`Edge with ID ${id} not found`);
    }
    
    return edge;
  }

  async create(createEdgeDto: CreateEdgeDto): Promise<Edge> {
    const { projectId, fromUIStateId, toUIStateId, description, triggeredBy, triggerType } = createEdgeDto;

    // プロジェクトが存在するかチェック
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // fromUIStateが存在するかチェック
    const fromUIState = await this.prisma.uiState.findUnique({
      where: { id: fromUIStateId }
    });
    
    if (!fromUIState) {
      throw new NotFoundException(`UIState with ID ${fromUIStateId} not found`);
    }

    // toUIStateが存在するかチェック
    const toUIState = await this.prisma.uiState.findUnique({
      where: { id: toUIStateId }
    });
    
    if (!toUIState) {
      throw new NotFoundException(`UIState with ID ${toUIStateId} not found`);
    }

    // 同じプロジェクトのUIStateかチェック
    if (fromUIState.projectId !== projectId || toUIState.projectId !== projectId) {
      throw new BadRequestException('UIStates must belong to the same project');
    }

    // 同じエッジが既に存在するかチェック
    const existingEdge = await this.prisma.edge.findFirst({
      where: {
        projectId,
        fromUIStateId,
        toUIStateId
      }
    });

    if (existingEdge) {
      throw new BadRequestException('Edge between these UIStates already exists');
    }

    return this.prisma.edge.create({
      data: {
        projectId,
        fromUIStateId,
        toUIStateId,
        description,
        triggeredBy,
        triggerType
      },
      include: {
        fromUIState: true,
        toUIState: true,
        project: true
      }
    });
  }

  async update(id: string, updateEdgeDto: UpdateEdgeDto): Promise<Edge> {
    // Edgeが存在するかチェック
    const existingEdge = await this.prisma.edge.findUnique({
      where: { id }
    });

    if (!existingEdge) {
      throw new NotFoundException(`Edge with ID ${id} not found`);
    }

    // UIStateの更新がある場合は存在チェック
    if (updateEdgeDto.fromUIStateId) {
      const fromUIState = await this.prisma.uiState.findUnique({
        where: { id: updateEdgeDto.fromUIStateId }
      });
      
      if (!fromUIState) {
        throw new NotFoundException(`UIState with ID ${updateEdgeDto.fromUIStateId} not found`);
      }

      if (fromUIState.projectId !== existingEdge.projectId) {
        throw new BadRequestException('UIState must belong to the same project');
      }
    }

    if (updateEdgeDto.toUIStateId) {
      const toUIState = await this.prisma.uiState.findUnique({
        where: { id: updateEdgeDto.toUIStateId }
      });
      
      if (!toUIState) {
        throw new NotFoundException(`UIState with ID ${updateEdgeDto.toUIStateId} not found`);
      }

      if (toUIState.projectId !== existingEdge.projectId) {
        throw new BadRequestException('UIState must belong to the same project');
      }
    }

    try {
      return await this.prisma.edge.update({
        where: { id },
        data: updateEdgeDto,
        include: {
          fromUIState: true,
          toUIState: true,
          project: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Edge with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.edge.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Edge with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findEdgesByUIState(uiStateId: string): Promise<{ outgoing: Edge[], incoming: Edge[] }> {
    const outgoing = await this.prisma.edge.findMany({
      where: { fromUIStateId: uiStateId },
      include: {
        fromUIState: true,
        toUIState: true,
        project: true
      }
    });

    const incoming = await this.prisma.edge.findMany({
      where: { toUIStateId: uiStateId },
      include: {
        fromUIState: true,
        toUIState: true,
        project: true
      }
    });

    return { outgoing, incoming };
  }
}
