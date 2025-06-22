import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateUIStateTransitionDto,
  UIStateTransitionResponseDto,
} from '../types/ui-state.types';

@Injectable()
export class UIStateTransitionsService {
  private readonly logger = new Logger(UIStateTransitionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateUIStateTransitionDto): Promise<UIStateTransitionResponseDto> {
    try {
      this.logger.log(`Creating UI state transition for session ${createDto.sessionId}`);

      // セッションの存在確認
      const session = await this.prisma.operationSession.findUnique({
        where: { id: createDto.sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Operation session with ID ${createDto.sessionId} not found`);
      }

      // プロジェクトの存在確認
      const project = await this.prisma.project.findUnique({
        where: { id: createDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${createDto.projectId} not found`);
      }

      // toUIStateの存在確認
      const toUIState = await this.prisma.uiState.findUnique({
        where: { id: createDto.toUIStateId },
      });

      if (!toUIState) {
        throw new NotFoundException(`UI state with ID ${createDto.toUIStateId} not found`);
      }

      // fromUIStateの存在確認（オプション）
      if (createDto.fromUIStateId) {
        const fromUIState = await this.prisma.uiState.findUnique({
          where: { id: createDto.fromUIStateId },
        });

        if (!fromUIState) {
          throw new NotFoundException(`UI state with ID ${createDto.fromUIStateId} not found`);
        }
      }

      const transition = await this.prisma.uIStateTransition.create({
        data: {
          sessionId: createDto.sessionId,
          projectId: createDto.projectId,
          fromUIStateId: createDto.fromUIStateId,
          toUIStateId: createDto.toUIStateId,
          triggerAction: createDto.triggerAction as any,
          beforeState: createDto.beforeState as any,
          afterState: createDto.afterState as any,
          metadata: createDto.metadata as any,
        },
      });

      this.logger.log(`Created UI state transition with ID ${transition.id}`);

      return {
        id: transition.id,
        sessionId: transition.sessionId,
        projectId: transition.projectId,
        fromUIStateId: transition.fromUIStateId,
        toUIStateId: transition.toUIStateId,
        triggerAction: transition.triggerAction as any,
        beforeState: transition.beforeState as any,
        afterState: transition.afterState as any,
        metadata: transition.metadata,
        timestamp: transition.timestamp,
      };
    } catch (error) {
      this.logger.error('Failed to create UI state transition', error.stack);
      throw error;
    }
  }

  async findAll(sessionId?: string, projectId?: string): Promise<UIStateTransitionResponseDto[]> {
    try {
      this.logger.log(`Finding UI state transitions${sessionId ? ` for session ${sessionId}` : ''}${projectId ? ` for project ${projectId}` : ''}`);

      const where: any = {};
      if (sessionId) where.sessionId = sessionId;
      if (projectId) where.projectId = projectId;

      const transitions = await this.prisma.uIStateTransition.findMany({
        where,
        orderBy: { timestamp: 'asc' },
      });

      return transitions.map(transition => ({
        id: transition.id,
        sessionId: transition.sessionId,
        projectId: transition.projectId,
        fromUIStateId: transition.fromUIStateId,
        toUIStateId: transition.toUIStateId,
        triggerAction: transition.triggerAction as any,
        beforeState: transition.beforeState as any,
        afterState: transition.afterState as any,
        metadata: transition.metadata,
        timestamp: transition.timestamp,
      }));
    } catch (error) {
      this.logger.error('Failed to find UI state transitions', error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<UIStateTransitionResponseDto> {
    try {
      this.logger.log(`Finding UI state transition with ID ${id}`);

      const transition = await this.prisma.uIStateTransition.findUnique({
        where: { id },
      });

      if (!transition) {
        throw new NotFoundException(`UI state transition with ID ${id} not found`);
      }

      return {
        id: transition.id,
        sessionId: transition.sessionId,
        projectId: transition.projectId,
        fromUIStateId: transition.fromUIStateId,
        toUIStateId: transition.toUIStateId,
        triggerAction: transition.triggerAction as any,
        beforeState: transition.beforeState as any,
        afterState: transition.afterState as any,
        metadata: transition.metadata,
        timestamp: transition.timestamp,
      };
    } catch (error) {
      this.logger.error(`Failed to find UI state transition with ID ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Removing UI state transition with ID ${id}`);

      // 遷移の存在確認
      const existingTransition = await this.prisma.uIStateTransition.findUnique({
        where: { id },
      });

      if (!existingTransition) {
        throw new NotFoundException(`UI state transition with ID ${id} not found`);
      }

      await this.prisma.uIStateTransition.delete({
        where: { id },
      });

      this.logger.log(`Removed UI state transition with ID ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove UI state transition with ID ${id}`, error.stack);
      throw error;
    }
  }

  async findBySessionWithDetails(sessionId: string): Promise<UIStateTransitionResponseDto[]> {
    try {
      this.logger.log(`Finding UI state transitions with details for session ${sessionId}`);

      const transitions = await this.prisma.uIStateTransition.findMany({
        where: { sessionId },
        include: {
          fromUIState: {
            select: { id: true, title: true, pageUrl: true },
          },
          toUIState: {
            select: { id: true, title: true, pageUrl: true },
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      return transitions.map(transition => ({
        id: transition.id,
        sessionId: transition.sessionId,
        projectId: transition.projectId,
        fromUIStateId: transition.fromUIStateId,
        toUIStateId: transition.toUIStateId,
        triggerAction: transition.triggerAction as any,
        beforeState: transition.beforeState as any,
        afterState: transition.afterState as any,
        metadata: transition.metadata,
        timestamp: transition.timestamp,
      }));
    } catch (error) {
      this.logger.error(`Failed to find UI state transitions with details for session ${sessionId}`, error.stack);
      throw error;
    }
  }

  async createBatch(transitions: CreateUIStateTransitionDto[]): Promise<number> {
    try {
      this.logger.log(`Creating batch of ${transitions.length} UI state transitions`);

      const result = await this.prisma.uIStateTransition.createMany({
        data: transitions.map(transition => ({
          sessionId: transition.sessionId,
          projectId: transition.projectId,
          fromUIStateId: transition.fromUIStateId,
          toUIStateId: transition.toUIStateId,
          triggerAction: transition.triggerAction as any,
          beforeState: transition.beforeState as any,
          afterState: transition.afterState as any,
          metadata: transition.metadata as any,
        })),
        skipDuplicates: true,
      });

      this.logger.log(`Created ${result.count} UI state transitions`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to create batch UI state transitions', error.stack);
      throw error;
    }
  }
}
