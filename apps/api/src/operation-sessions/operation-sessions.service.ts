import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateOperationSessionDto,
  UpdateOperationSessionDto,
  OperationSessionResponseDto,
} from '../types/ui-state.types';

@Injectable()
export class OperationSessionsService {
  private readonly logger = new Logger(OperationSessionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateOperationSessionDto): Promise<OperationSessionResponseDto> {
    try {
      this.logger.log(`Creating operation session for project ${createDto.projectId}`);

      // プロジェクトの存在確認
      const project = await this.prisma.project.findUnique({
        where: { id: createDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${createDto.projectId} not found`);
      }

      const session = await this.prisma.operationSession.create({
        data: {
          projectId: createDto.projectId,
          userGoal: createDto.userGoal,
          status: 'active',
        },
        include: {
          _count: {
            select: { uiStateTransitions: true },
          },
        },
      });

      this.logger.log(`Created operation session with ID ${session.id}`);

      return {
        id: session.id,
        projectId: session.projectId,
        startTime: session.startTime,
        endTime: session.endTime,
        userGoal: session.userGoal,
        status: session.status,
        summary: session.summary,
        transitionCount: session._count.uiStateTransitions,
      };
    } catch (error) {
      this.logger.error('Failed to create operation session', error.stack);
      throw error;
    }
  }

  async findAll(projectId?: string): Promise<OperationSessionResponseDto[]> {
    try {
      this.logger.log(`Finding operation sessions${projectId ? ` for project ${projectId}` : ''}`);

      const sessions = await this.prisma.operationSession.findMany({
        where: projectId ? { projectId } : undefined,
        include: {
          _count: {
            select: { uiStateTransitions: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return sessions.map(session => ({
        id: session.id,
        projectId: session.projectId,
        startTime: session.startTime,
        endTime: session.endTime,
        userGoal: session.userGoal,
        status: session.status,
        summary: session.summary,
        transitionCount: session._count.uiStateTransitions,
      }));
    } catch (error) {
      this.logger.error('Failed to find operation sessions', error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<OperationSessionResponseDto> {
    try {
      this.logger.log(`Finding operation session with ID ${id}`);

      const session = await this.prisma.operationSession.findUnique({
        where: { id },
        include: {
          _count: {
            select: { uiStateTransitions: true },
          },
        },
      });

      if (!session) {
        throw new NotFoundException(`Operation session with ID ${id} not found`);
      }

      return {
        id: session.id,
        projectId: session.projectId,
        startTime: session.startTime,
        endTime: session.endTime,
        userGoal: session.userGoal,
        status: session.status,
        summary: session.summary,
        transitionCount: session._count.uiStateTransitions,
      };
    } catch (error) {
      this.logger.error(`Failed to find operation session with ID ${id}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateOperationSessionDto): Promise<OperationSessionResponseDto> {
    try {
      this.logger.log(`Updating operation session with ID ${id}`);

      // セッションの存在確認
      const existingSession = await this.prisma.operationSession.findUnique({
        where: { id },
      });

      if (!existingSession) {
        throw new NotFoundException(`Operation session with ID ${id} not found`);
      }

      const session = await this.prisma.operationSession.update({
        where: { id },
        data: updateDto,
        include: {
          _count: {
            select: { uiStateTransitions: true },
          },
        },
      });

      this.logger.log(`Updated operation session with ID ${id}`);

      return {
        id: session.id,
        projectId: session.projectId,
        startTime: session.startTime,
        endTime: session.endTime,
        userGoal: session.userGoal,
        status: session.status,
        summary: session.summary,
        transitionCount: session._count.uiStateTransitions,
      };
    } catch (error) {
      this.logger.error(`Failed to update operation session with ID ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Removing operation session with ID ${id}`);

      // セッションの存在確認
      const existingSession = await this.prisma.operationSession.findUnique({
        where: { id },
      });

      if (!existingSession) {
        throw new NotFoundException(`Operation session with ID ${id} not found`);
      }

      await this.prisma.operationSession.delete({
        where: { id },
      });

      this.logger.log(`Removed operation session with ID ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove operation session with ID ${id}`, error.stack);
      throw error;
    }
  }

  async endSession(id: string, summary?: any): Promise<OperationSessionResponseDto> {
    return this.update(id, {
      endTime: new Date(),
      status: 'completed',
      summary,
    });
  }

  async abandonSession(id: string): Promise<OperationSessionResponseDto> {
    return this.update(id, {
      endTime: new Date(),
      status: 'abandoned',
    });
  }
}
