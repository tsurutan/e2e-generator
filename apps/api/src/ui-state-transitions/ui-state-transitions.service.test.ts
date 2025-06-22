import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {Test, TestingModule} from '@nestjs/testing';
import {NotFoundException} from '@nestjs/common';
import {UIStateTransitionsService} from './ui-state-transitions.service';
import {PrismaService} from '../prisma/prisma.service';
import {CreateUIStateTransitionDto} from '../types/ui-state.types';
import {createTestPrismaInstance, cleanupTestDatabaseWithInstance, getTestDatabase} from '../test/test-database';

describe('UIStateTransitionsService', () => {
    let service: UIStateTransitionsService;
    let prismaService: PrismaService;
    let testPrisma: PrismaService;
    let testProject: any;
    let testSession: any;
    let testPage: any;
    let testFromUIState: any;
    let testToUIState: any;

    beforeEach(async () => {
        // テスト開始前にデータベースをクリーンアップ
        await cleanupTestDatabaseWithInstance(getTestDatabase());

        // テスト用のPrismaServiceを作成
        testPrisma = createTestPrismaInstance();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: UIStateTransitionsService,
                    useFactory: (prisma: PrismaService) => new UIStateTransitionsService(prisma),
                    inject: [PrismaService],
                },
                {
                    provide: PrismaService,
                    useValue: testPrisma,
                },
            ],
        }).compile();

        service = module.get<UIStateTransitionsService>(UIStateTransitionsService);
        prismaService = module.get<PrismaService>(PrismaService);

        // テスト用データを作成
        testProject = await testPrisma.project.create({
            data: {
                name: 'テストプロジェクト',
                url: 'https://example.com',
                description: 'テスト用のプロジェクト',
            },
        });

        // ユニークなページURLを生成してテスト間の競合を避ける
        const uniquePageUrl = `https://example.com/test-${Date.now()}-${Math.random()}`;
        testPage = await testPrisma.page.create({
            data: {
                url: uniquePageUrl,
                title: 'テストページ',
                projectId: testProject.id,
            },
        });

        // UI stateを作成する前に、Pageが確実に存在することを確認
        // 既存のtestPageを使用するのではなく、新しいページを作成
        const existingPage = await testPrisma.page.findUnique({
            where: {
                projectId_url: {
                    projectId: testProject.id,
                    url: testPage.url,
                },
            },
        });

        if (!existingPage) {
            await testPrisma.page.create({
                data: {
                    url: testPage.url,
                    title: testPage.title,
                    projectId: testProject.id,
                },
            });
        }

        testFromUIState = await testPrisma.uiState.create({
            data: {
                title: '初期状態',
                description: '初期のUI状態',
                pageUrl: testPage.url,
                projectId: testProject.id,
                isDefault: true,
            },
        });

        testToUIState = await testPrisma.uiState.create({
            data: {
                title: '遷移後状態',
                description: '遷移後のUI状態',
                pageUrl: testPage.url,
                projectId: testProject.id,
                isDefault: false,
            },
        });

        testSession = await testPrisma.operationSession.create({
            data: {
                projectId: testProject.id,
                userGoal: 'テストセッション',
                status: 'active',
            },
        });
    });

    afterEach(async () => {
        // 各テスト後に軽量なクリーンアップ（次のテストのbeforeEachで完全クリーンアップ）
        try {
            await testPrisma.uIStateTransition.deleteMany();
        } catch (error) {
            // エラーは無視（次のbeforeEachで完全クリーンアップされる）
        }
    });

    describe('create', () => {
        it('有効なデータで遷移を正常に作成する', async () => {
            const createDto: CreateUIStateTransitionDto = {
                sessionId: testSession.id,
                projectId: testProject.id,
                fromUIStateId: testFromUIState.id,
                toUIStateId: testToUIState.id,
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
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#username',
                },
                afterState: {
                    visibleElements: ['#dashboard'],
                    hiddenElements: ['#login-form'],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#dashboard',
                },
                metadata: {userAgent: 'test-browser'},
            };

            const result = await service.create(createDto);

            expect(result.id).toBeDefined();
            expect(result.sessionId).toBe(testSession.id);
            expect(result.projectId).toBe(testProject.id);
            expect(result.fromUIStateId).toBe(testFromUIState.id);
            expect(result.toUIStateId).toBe(testToUIState.id);
            expect(result.triggerAction).toEqual(createDto.triggerAction);
            expect(result.beforeState).toEqual(createDto.beforeState);
            expect(result.afterState).toEqual(createDto.afterState);
            expect(result.metadata).toEqual(createDto.metadata);
            expect(result.timestamp).toBeInstanceOf(Date);
        });

        it('存在しないセッションでNotFoundExceptionをスローする', async () => {
            const createDto: CreateUIStateTransitionDto = {
                sessionId: 'nonexistent-session-id',
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#test-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#result',
                },
            };

            await expect(service.create(createDto)).rejects.toThrow(
                new NotFoundException('Operation session with ID nonexistent-session-id not found')
            );
        });

        it('存在しないプロジェクトでNotFoundExceptionをスローする', async () => {
            const createDto: CreateUIStateTransitionDto = {
                sessionId: testSession.id,
                projectId: 'nonexistent-project-id',
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#test-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#result',
                },
            };

            await expect(service.create(createDto)).rejects.toThrow(
                new NotFoundException('Project with ID nonexistent-project-id not found')
            );
        });

        it('存在しないtoUIStateでNotFoundExceptionをスローする', async () => {
            const createDto: CreateUIStateTransitionDto = {
                sessionId: testSession.id,
                projectId: testProject.id,
                toUIStateId: 'nonexistent-ui-state-id',
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#test-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#result',
                },
            };

            await expect(service.create(createDto)).rejects.toThrow(
                new NotFoundException('UI state with ID nonexistent-ui-state-id not found')
            );
        });

        it('fromUIStateIdがnullの場合でも正常に作成する', async () => {
            const createDto: CreateUIStateTransitionDto = {
                sessionId: testSession.id,
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#initial-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#form'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#form',
                },
            };

            const result = await service.create(createDto);

            expect(result.fromUIStateId).toBeNull();
            expect(result.toUIStateId).toBe(testToUIState.id);
            expect(result.sessionId).toBe(testSession.id);
        });
    });

    describe('findAll', () => {
        it('全ての遷移を取得する', async () => {
            // テスト用の遷移を作成
            const transition1 = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#btn1',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#form'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#form',
                },
            });

            const transition2 = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                fromUIStateId: testFromUIState.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'input',
                    element: 'input',
                    selector: '#input1',
                    timestamp: '2025-06-22T10:01:00Z',
                },
                beforeState: {
                    visibleElements: ['#form'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#form',
                },
                afterState: {
                    visibleElements: ['#form', '#submit'],
                    hiddenElements: [],
                    formValues: {input1: 'test'},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#input1',
                },
            });

            const result = await service.findAll();

            expect(result.length).toBeGreaterThanOrEqual(2);
            expect(result.some(t => t.id === transition1.id)).toBe(true);
            expect(result.some(t => t.id === transition2.id)).toBe(true);
        });

        it('特定のセッションの遷移を取得する', async () => {
            // 別のセッションを作成
            const otherSession = await testPrisma.operationSession.create({
                data: {
                    projectId: testProject.id,
                    userGoal: '別のテストセッション',
                    status: 'active',
                },
            });

            // 各セッションに遷移を作成
            const sessionTransition = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#session-btn',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#result',
                },
            });

            await service.create({
                sessionId: otherSession.id,
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#other-btn',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#other-result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#other-result',
                },
            });

            const result = await service.findAll(testSession.id);

            expect(result.some(t => t.id === sessionTransition.id)).toBe(true);
            expect(result.every(t => t.sessionId === testSession.id)).toBe(true);
        });

        it('特定のプロジェクトの遷移を取得する', async () => {
            // 別のプロジェクトを作成
            const otherProject = await testPrisma.project.create({
                data: {
                    name: '別のテストプロジェクト',
                    url: 'https://other.example.com',
                    description: '別のテスト用プロジェクト',
                },
            });

            const otherSession = await testPrisma.operationSession.create({
                data: {
                    projectId: otherProject.id,
                    userGoal: '別プロジェクトのセッション',
                    status: 'active',
                },
            });

            // ユニークなページURLを生成
            const otherUniquePageUrl = `https://other.example.com/test-${Date.now()}-${Math.random()}`;
            const otherPage = await testPrisma.page.create({
                data: {
                    url: otherUniquePageUrl,
                    title: '別のテストページ',
                    projectId: otherProject.id,
                },
            });

            const otherUIState = await testPrisma.uiState.create({
                data: {
                    title: '別プロジェクトの状態',
                    description: '別プロジェクトのUI状態',
                    pageUrl: otherPage.url,
                    projectId: otherProject.id,
                    isDefault: true,
                },
            });

            // 各プロジェクトに遷移を作成
            const projectTransition = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#project-btn',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#project-result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#project-result',
                },
            });

            await service.create({
                sessionId: otherSession.id,
                projectId: otherProject.id,
                toUIStateId: otherUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#other-project-btn',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#other-project-result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#other-project-result',
                },
            });

            const result = await service.findAll(undefined, testProject.id);

            expect(result.some(t => t.id === projectTransition.id)).toBe(true);
            expect(result.every(t => t.projectId === testProject.id)).toBe(true);
        });
    });

    describe('findOne', () => {
        it('存在する遷移を正常に取得する', async () => {
            // テスト用の遷移を作成
            const createdTransition = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                fromUIStateId: testFromUIState.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#test-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#result',
                },
                metadata: {userAgent: 'test-browser'},
            });

            const result = await service.findOne(createdTransition.id);

            expect(result.id).toBe(createdTransition.id);
            expect(result.sessionId).toBe(testSession.id);
            expect(result.projectId).toBe(testProject.id);
            expect(result.fromUIStateId).toBe(testFromUIState.id);
            expect(result.toUIStateId).toBe(testToUIState.id);
        });

        it('存在しない遷移でNotFoundExceptionをスローする', async () => {
            await expect(service.findOne('nonexistent-id')).rejects.toThrow(
                new NotFoundException('UI state transition with ID nonexistent-id not found')
            );
        });
    });

    describe('remove', () => {
        it('存在する遷移を正常に削除する', async () => {
            // テスト用の遷移を作成
            const createdTransition = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#delete-test-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#result'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#result',
                },
            });

            await service.remove(createdTransition.id);

            // 削除されたことを確認
            await expect(service.findOne(createdTransition.id)).rejects.toThrow(
                new NotFoundException(`UI state transition with ID ${createdTransition.id} not found`)
            );
        });

        it('存在しない遷移でNotFoundExceptionをスローする', async () => {
            await expect(service.remove('nonexistent-id')).rejects.toThrow(
                new NotFoundException('UI state transition with ID nonexistent-id not found')
            );
        });
    });

    describe('findBySessionWithDetails', () => {
        it('セッションの詳細付き遷移を取得する', async () => {
            // テスト用の遷移を作成
            const createdTransition = await service.create({
                sessionId: testSession.id,
                projectId: testProject.id,
                fromUIStateId: testFromUIState.id,
                toUIStateId: testToUIState.id,
                triggerAction: {
                    type: 'click',
                    element: 'button',
                    selector: '#details-test-button',
                    timestamp: '2025-06-22T10:00:00Z',
                },
                beforeState: {
                    visibleElements: [],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '',
                },
                afterState: {
                    visibleElements: ['#form'],
                    hiddenElements: [],
                    formValues: {},
                    scrollPosition: {x: 0, y: 0},
                    activeElement: '#form',
                },
                metadata: {userAgent: 'test-browser'},
            });

            const result = await service.findBySessionWithDetails(testSession.id);

            expect(result.length).toBeGreaterThanOrEqual(1);
            const foundTransition = result.find(t => t.id === createdTransition.id);
            expect(foundTransition).toBeDefined();

            // findBySessionWithDetailsはUIStateTransitionWithDetailsResponseDtoを返すので、
            // includeされたリレーションデータが含まれている
            expect(foundTransition?.fromUIState).toBeDefined();
            expect(foundTransition?.toUIState).toBeDefined();
            expect(foundTransition?.fromUIState?.title).toBe(testFromUIState.title);
            expect(foundTransition?.toUIState?.title).toBe(testToUIState.title);
        });
    });

    describe('createBatch', () => {
        it('複数の遷移を一括作成する', async () => {
            const batchTransitions: CreateUIStateTransitionDto[] = [
                {
                    sessionId: testSession.id,
                    projectId: testProject.id,
                    toUIStateId: testFromUIState.id,
                    triggerAction: {
                        type: 'click',
                        element: 'button',
                        selector: '#batch-btn1',
                        timestamp: '2025-06-22T10:00:00Z',
                    },
                    beforeState: {
                        visibleElements: [],
                        hiddenElements: [],
                        formValues: {},
                        scrollPosition: {x: 0, y: 0},
                        activeElement: '',
                    },
                    afterState: {
                        visibleElements: ['#form'],
                        hiddenElements: [],
                        formValues: {},
                        scrollPosition: {x: 0, y: 0},
                        activeElement: '#form',
                    },
                },
                {
                    sessionId: testSession.id,
                    projectId: testProject.id,
                    toUIStateId: testToUIState.id,
                    triggerAction: {
                        type: 'input',
                        element: 'input',
                        selector: '#batch-input1',
                        timestamp: '2025-06-22T10:01:00Z',
                    },
                    beforeState: {
                        visibleElements: ['#form'],
                        hiddenElements: [],
                        formValues: {},
                        scrollPosition: {x: 0, y: 0},
                        activeElement: '#form',
                    },
                    afterState: {
                        visibleElements: ['#form'],
                        hiddenElements: [],
                        formValues: {input1: 'test'},
                        scrollPosition: {x: 0, y: 0},
                        activeElement: '#batch-input1',
                    },
                },
            ];

            const result = await service.createBatch(batchTransitions);

            expect(result).toBe(2);

            // 作成された遷移を確認
            const transitions = await service.findAll(testSession.id);
            const batchTransitionIds = transitions
                .filter(t =>
                    t.triggerAction?.selector === '#batch-btn1' ||
                    t.triggerAction?.selector === '#batch-input1'
                );
            expect(batchTransitionIds).toHaveLength(2);
        });
    });
});
