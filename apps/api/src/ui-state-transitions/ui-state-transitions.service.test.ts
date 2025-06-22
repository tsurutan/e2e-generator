import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UIStateTransitionsService } from './ui-state-transitions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUIStateTransitionDto } from '../types/ui-state.types';
import { getTestDatabase } from '../test/test-database';

describe('UIStateTransitionsService', () => {
  let service: UIStateTransitionsService;
  let prismaService: PrismaService;
  let testProject: any;
  let testSession: any;
  let testPage: any;
  let testFromUIState: any;
  let testToUIState: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UIStateTransitionsService,
        {
          provide: PrismaService,
          useValue: getTestDatabase(),
        },
      ],
    }).compile();

    service = module.get<UIStateTransitionsService>(UIStateTransitionsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // テスト用データを作成
    testProject = await prismaService.project.create({
      data: {
        name: 'テストプロジェクト',
        url: 'https://example.com',
        description: 'テスト用のプロジェクト',
      },
    });

    testPage = await prismaService.page.create({
      data: {
        url: 'https://example.com/test',
        title: 'テストページ',
        projectId: testProject.id,
      },
    });

    testFromUIState = await prismaService.uiState.create({
      data: {
        title: '初期状態',
        description: '初期のUI状態',
        pageUrl: testPage.url,
        projectId: testProject.id,
        isDefault: true,
      },
    });

    testToUIState = await prismaService.uiState.create({
      data: {
        title: '遷移後状態',
        description: '遷移後のUI状態',
        pageUrl: testPage.url,
        projectId: testProject.id,
        isDefault: false,
      },
    });

    testSession = await prismaService.operationSession.create({
      data: {
        projectId: testProject.id,
        userGoal: 'テストセッション',
        status: 'active',
      },
    });
  });

  describe('create', () => {
    const createDto: CreateUIStateTransitionDto = {
      sessionId: 'session-123',
      projectId: 'project-123',
      fromUIStateId: 'ui-state-1',
      toUIStateId: 'ui-state-2',
      triggerAction: {
        type: 'click',
        element: 'button',
        selector: '#login-button',
        timestamp: '2025-06-22T10:00:00Z',
      },
      beforeState: {
        visibleElements: ['#login-form'],
        hiddenElements: [],
        formValues: {},
        scrollPosition: { x: 0, y: 0 },
        activeElement: '#username',
      },
      afterState: {
        visibleElements: ['#dashboard'],
        hiddenElements: ['#login-form'],
        formValues: {},
        scrollPosition: { x: 0, y: 0 },
        activeElement: '#dashboard',
      },
      metadata: { userAgent: 'test-browser' },
    };

    const mockSession = { id: 'session-123', projectId: 'project-123' };
    const mockProject = { id: 'project-123', name: 'テストプロジェクト' };
    const mockFromUIState = { id: 'ui-state-1', title: '初期状態' };
    const mockToUIState = { id: 'ui-state-2', title: '遷移後状態' };

    const mockTransition = {
      id: 'transition-123',
      sessionId: 'session-123',
      projectId: 'project-123',
      fromUIStateId: 'ui-state-1',
      toUIStateId: 'ui-state-2',
      triggerAction: createDto.triggerAction,
      beforeState: createDto.beforeState,
      afterState: createDto.afterState,
      metadata: createDto.metadata,
      timestamp: new Date('2025-06-22T10:00:00Z'),
      createdAt: new Date('2025-06-22T10:00:00Z'),
      updatedAt: new Date('2025-06-22T10:00:00Z'),
    };

    it('有効なデータで遷移を正常に作成する', async () => {
      mockPrismaService.operationSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.uiState.findUnique
        .mockResolvedValueOnce(mockFromUIState) // fromUIState
        .mockResolvedValueOnce(mockToUIState);  // toUIState
      mockPrismaService.uIStateTransition.create.mockResolvedValue(mockTransition);

      const result = await service.create(createDto);

      expect(mockPrismaService.operationSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      });
      expect(mockPrismaService.uiState.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.uIStateTransition.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-123',
          projectId: 'project-123',
          fromUIStateId: 'ui-state-1',
          toUIStateId: 'ui-state-2',
          triggerAction: createDto.triggerAction,
          beforeState: createDto.beforeState,
          afterState: createDto.afterState,
          metadata: createDto.metadata,
        },
      });
      expect(result.id).toBe('transition-123');
    });

    it('存在しないセッションでNotFoundExceptionをスローする', async () => {
      mockPrismaService.operationSession.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Operation session with ID session-123 not found')
      );

      expect(mockPrismaService.project.findUnique).not.toHaveBeenCalled();
    });

    it('存在しないプロジェクトでNotFoundExceptionをスローする', async () => {
      mockPrismaService.operationSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Project with ID project-123 not found')
      );

      expect(mockPrismaService.uiState.findUnique).not.toHaveBeenCalled();
    });

    it('存在しないtoUIStateでNotFoundExceptionをスローする', async () => {
      mockPrismaService.operationSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.uiState.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('UI state with ID ui-state-2 not found')
      );
    });

    it('fromUIStateIdがnullの場合でも正常に作成する', async () => {
      const createDtoWithoutFrom = { ...createDto, fromUIStateId: undefined };
      const transitionWithoutFrom = { ...mockTransition, fromUIStateId: null };

      mockPrismaService.operationSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.uiState.findUnique.mockResolvedValue(mockToUIState);
      mockPrismaService.uIStateTransition.create.mockResolvedValue(transitionWithoutFrom);

      const result = await service.create(createDtoWithoutFrom);

      expect(result.fromUIStateId).toBeNull();
      expect(mockPrismaService.uiState.findUnique).toHaveBeenCalledTimes(1); // toUIStateのみ
    });
  });

  describe('findAll', () => {
    const mockTransitions = [
      {
        id: 'transition-1',
        sessionId: 'session-123',
        projectId: 'project-123',
        fromUIStateId: null,
        toUIStateId: 'ui-state-1',
        triggerAction: { type: 'click', element: 'button' },
        beforeState: { visibleElements: [] },
        afterState: { visibleElements: ['#form'] },
        metadata: null,
        timestamp: new Date('2025-06-22T10:00:00Z'),
      },
      {
        id: 'transition-2',
        sessionId: 'session-123',
        projectId: 'project-123',
        fromUIStateId: 'ui-state-1',
        toUIStateId: 'ui-state-2',
        triggerAction: { type: 'input', element: 'input' },
        beforeState: { visibleElements: ['#form'] },
        afterState: { visibleElements: ['#form', '#submit'] },
        metadata: null,
        timestamp: new Date('2025-06-22T10:01:00Z'),
      },
    ];

    it('全ての遷移を取得する', async () => {
      mockPrismaService.uIStateTransition.findMany.mockResolvedValue(mockTransitions);

      const result = await service.findAll();

      expect(mockPrismaService.uIStateTransition.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('特定のセッションの遷移を取得する', async () => {
      mockPrismaService.uIStateTransition.findMany.mockResolvedValue(mockTransitions);

      const result = await service.findAll('session-123');

      expect(mockPrismaService.uIStateTransition.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        orderBy: { timestamp: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('特定のプロジェクトの遷移を取得する', async () => {
      mockPrismaService.uIStateTransition.findMany.mockResolvedValue(mockTransitions);

      const result = await service.findAll(undefined, 'project-123');

      expect(mockPrismaService.uIStateTransition.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        orderBy: { timestamp: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    const mockTransition = {
      id: 'transition-123',
      sessionId: 'session-123',
      projectId: 'project-123',
      fromUIStateId: 'ui-state-1',
      toUIStateId: 'ui-state-2',
      triggerAction: { type: 'click' },
      beforeState: { visibleElements: [] },
      afterState: { visibleElements: ['#result'] },
      metadata: null,
      timestamp: new Date('2025-06-22T10:00:00Z'),
    };

    it('存在する遷移を正常に取得する', async () => {
      mockPrismaService.uIStateTransition.findUnique.mockResolvedValue(mockTransition);

      const result = await service.findOne('transition-123');

      expect(mockPrismaService.uIStateTransition.findUnique).toHaveBeenCalledWith({
        where: { id: 'transition-123' },
      });
      expect(result.id).toBe('transition-123');
    });

    it('存在しない遷移でNotFoundExceptionをスローする', async () => {
      mockPrismaService.uIStateTransition.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('UI state transition with ID nonexistent-id not found')
      );
    });
  });

  describe('remove', () => {
    const existingTransition = {
      id: 'transition-123',
      sessionId: 'session-123',
    };

    it('存在する遷移を正常に削除する', async () => {
      mockPrismaService.uIStateTransition.findUnique.mockResolvedValue(existingTransition);
      mockPrismaService.uIStateTransition.delete.mockResolvedValue(existingTransition);

      await service.remove('transition-123');

      expect(mockPrismaService.uIStateTransition.findUnique).toHaveBeenCalledWith({
        where: { id: 'transition-123' },
      });
      expect(mockPrismaService.uIStateTransition.delete).toHaveBeenCalledWith({
        where: { id: 'transition-123' },
      });
    });

    it('存在しない遷移でNotFoundExceptionをスローする', async () => {
      mockPrismaService.uIStateTransition.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        new NotFoundException('UI state transition with ID nonexistent-id not found')
      );

      expect(mockPrismaService.uIStateTransition.delete).not.toHaveBeenCalled();
    });
  });

  describe('findBySessionWithDetails', () => {
    const mockTransitionsWithDetails = [
      {
        id: 'transition-1',
        sessionId: 'session-123',
        projectId: 'project-123',
        fromUIStateId: null,
        toUIStateId: 'ui-state-1',
        triggerAction: { type: 'click' },
        beforeState: { visibleElements: [] },
        afterState: { visibleElements: ['#form'] },
        metadata: null,
        timestamp: new Date('2025-06-22T10:00:00Z'),
        fromUIState: null,
        toUIState: { id: 'ui-state-1', title: 'フォーム画面', pageUrl: 'https://example.com/form' },
      },
    ];

    it('セッションの詳細付き遷移を取得する', async () => {
      mockPrismaService.uIStateTransition.findMany.mockResolvedValue(mockTransitionsWithDetails);

      const result = await service.findBySessionWithDetails('session-123');

      expect(mockPrismaService.uIStateTransition.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
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
      expect(result).toHaveLength(1);
    });
  });

  describe('createBatch', () => {
    const batchTransitions: CreateUIStateTransitionDto[] = [
      {
        sessionId: 'session-123',
        projectId: 'project-123',
        toUIStateId: 'ui-state-1',
        triggerAction: { type: 'click', element: 'button', selector: '#btn1', timestamp: '2025-06-22T10:00:00Z' },
        beforeState: { visibleElements: [], hiddenElements: [], formValues: {}, scrollPosition: { x: 0, y: 0 }, activeElement: '' },
        afterState: { visibleElements: ['#form'], hiddenElements: [], formValues: {}, scrollPosition: { x: 0, y: 0 }, activeElement: '#form' },
      },
      {
        sessionId: 'session-123',
        projectId: 'project-123',
        toUIStateId: 'ui-state-2',
        triggerAction: { type: 'input', element: 'input', selector: '#input1', timestamp: '2025-06-22T10:01:00Z' },
        beforeState: { visibleElements: ['#form'], hiddenElements: [], formValues: {}, scrollPosition: { x: 0, y: 0 }, activeElement: '#form' },
        afterState: { visibleElements: ['#form'], hiddenElements: [], formValues: { input1: 'test' }, scrollPosition: { x: 0, y: 0 }, activeElement: '#input1' },
      },
    ];

    it('複数の遷移を一括作成する', async () => {
      mockPrismaService.uIStateTransition.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBatch(batchTransitions);

      expect(mockPrismaService.uIStateTransition.createMany).toHaveBeenCalledWith({
        data: batchTransitions.map(transition => ({
          sessionId: transition.sessionId,
          projectId: transition.projectId,
          fromUIStateId: transition.fromUIStateId,
          toUIStateId: transition.toUIStateId,
          triggerAction: transition.triggerAction,
          beforeState: transition.beforeState,
          afterState: transition.afterState,
          metadata: transition.metadata,
        })),
        skipDuplicates: true,
      });
      expect(result).toBe(2);
    });
  });
});
