import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OperationSessionsService } from './operation-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperationSessionDto, UpdateOperationSessionDto } from '../types/ui-state.types';
import { getTestDatabase } from '../test/test-database';

describe('OperationSessionsService', () => {
  let service: OperationSessionsService;
  let prismaService: PrismaService;
  let testProject: any;

  beforeEach(async () => {
    // テスト用のPrismaServiceを作成
    const testPrisma = getTestDatabase();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationSessionsService,
        {
          provide: PrismaService,
          useValue: testPrisma,
        },
      ],
    }).compile();

    service = module.get<OperationSessionsService>(OperationSessionsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // テスト用プロジェクトを作成
    testProject = await testPrisma.project.create({
      data: {
        name: 'テストプロジェクト',
        url: 'https://example.com',
        description: 'テスト用のプロジェクト',
      },
    });
  });

  describe('create', () => {
    it('有効なプロジェクトIDでセッションを正常に作成する', async () => {
      const createDto: CreateOperationSessionDto = {
        projectId: testProject.id,
        userGoal: 'ログイン機能のテスト',
      };

      const result = await service.create(createDto);

      expect(result.id).toBeDefined();
      expect(result.projectId).toBe(testProject.id);
      expect(result.userGoal).toBe('ログイン機能のテスト');
      expect(result.status).toBe('active');
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeNull();
      expect(result.transitionCount).toBe(0);
    });

    it('存在しないプロジェクトIDでNotFoundExceptionをスローする', async () => {
      const createDto: CreateOperationSessionDto = {
        projectId: 'nonexistent-project-id',
        userGoal: 'テスト',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Project with ID nonexistent-project-id not found')
      );
    });

    it('userGoalなしでセッションを作成する', async () => {
      const createDto: CreateOperationSessionDto = {
        projectId: testProject.id,
      };

      const result = await service.create(createDto);

      expect(result.projectId).toBe(testProject.id);
      expect(result.userGoal).toBeNull();
      expect(result.status).toBe('active');
    });
  });

  describe('findAll', () => {
    it('全てのセッションを取得する', async () => {
      // テスト用セッションを作成
      const session1 = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト1',
      });
      const session2 = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト2',
      });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result.some(s => s.id === session1.id)).toBe(true);
      expect(result.some(s => s.id === session2.id)).toBe(true);
      expect(result[0].transitionCount).toBe(0);
      expect(result[1].transitionCount).toBe(0);
    });

    it('特定のプロジェクトのセッションを取得する', async () => {
      // 別のプロジェクトを作成
      const otherProject = await prismaService.project.create({
        data: {
          name: '別のプロジェクト',
          url: 'https://other.com',
        },
      });

      // 各プロジェクトにセッションを作成
      await service.create({
        projectId: testProject.id,
        userGoal: 'テストプロジェクトのセッション',
      });
      await service.create({
        projectId: otherProject.id,
        userGoal: '別プロジェクトのセッション',
      });

      const result = await service.findAll(testProject.id);

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe(testProject.id);
      expect(result[0].userGoal).toBe('テストプロジェクトのセッション');
    });
  });

  describe('findOne', () => {
    it('存在するセッションを正常に取得する', async () => {
      const createdSession = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト',
      });

      const result = await service.findOne(createdSession.id);

      expect(result.id).toBe(createdSession.id);
      expect(result.projectId).toBe(testProject.id);
      expect(result.userGoal).toBe('テスト');
      expect(result.transitionCount).toBe(0);
    });

    it('存在しないセッションでNotFoundExceptionをスローする', async () => {
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Operation session with ID nonexistent-id not found')
      );
    });
  });

  describe('update', () => {
    it('存在するセッションを正常に更新する', async () => {
      const createdSession = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト',
      });

      const updateDto: UpdateOperationSessionDto = {
        status: 'completed',
        summary: { totalActions: 10 },
      };

      const result = await service.update(createdSession.id, updateDto);

      expect(result.id).toBe(createdSession.id);
      expect(result.status).toBe('completed');
      expect(result.summary).toEqual({ totalActions: 10 });
    });

    it('存在しないセッションでNotFoundExceptionをスローする', async () => {
      const updateDto: UpdateOperationSessionDto = {
        status: 'completed',
      };

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(
        new NotFoundException('Operation session with ID nonexistent-id not found')
      );
    });
  });

  describe('remove', () => {
    it('存在するセッションを正常に削除する', async () => {
      const createdSession = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト',
      });

      await service.remove(createdSession.id);

      // 削除されたことを確認
      await expect(service.findOne(createdSession.id)).rejects.toThrow(
        new NotFoundException(`Operation session with ID ${createdSession.id} not found`)
      );
    });

    it('存在しないセッションでNotFoundExceptionをスローする', async () => {
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Operation session with ID nonexistent-id not found')
      );
    });
  });

  describe('endSession', () => {
    it('セッションを正常に終了する', async () => {
      const createdSession = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト',
      });

      const summary = { totalActions: 15, completedGoal: true };
      const result = await service.endSession(createdSession.id, summary);

      expect(result.status).toBe('completed');
      expect(result.summary).toEqual(summary);
      expect(result.endTime).toBeInstanceOf(Date);
    });
  });

  describe('abandonSession', () => {
    it('セッションを正常に放棄する', async () => {
      const createdSession = await service.create({
        projectId: testProject.id,
        userGoal: 'テスト',
      });

      const result = await service.abandonSession(createdSession.id);

      expect(result.status).toBe('abandoned');
      expect(result.endTime).toBeInstanceOf(Date);
    });
  });
});
