# テスト・検証タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](../../DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- テストケース名は日本語で記述
- Reactテストは Testing Library を使用し、アクセシビリティを重視
- テスト内でのロジック実装を最小限に抑制

## Phase 1: 単体テスト実装

### Task 6.1: AdvancedUIStateTracker単体テスト
**優先度**: 🔴 高
**期間**: 2日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] `AdvancedUIStateTracker`の単体テスト作成
- [ ] DOMスナップショット機能のテスト
- [ ] 状態差分計算のテスト
- [ ] セッション管理のテスト
- [ ] Observer統合のテスト

#### 実装ファイル
- `apps/app/src/renderer/utils/__tests__/AdvancedUIStateTracker.test.ts`

#### テストケース
```typescript
describe('AdvancedUIStateTracker', () => {
  let tracker: AdvancedUIStateTracker;
  let mockWebview: jest.Mocked<Electron.WebviewTag>;

  beforeEach(() => {
    mockWebview = createMockWebview();
    tracker = new AdvancedUIStateTracker(mockWebview);
  });

  describe('captureSnapshot', () => {
    it('should capture visible elements correctly', async () => {
      // テスト実装
    });

    it('should capture form values correctly', async () => {
      // テスト実装
    });

    it('should handle empty DOM correctly', async () => {
      // テスト実装
    });
  });

  describe('calculateStateDiff', () => {
    it('should detect new elements', () => {
      // テスト実装
    });

    it('should detect removed elements', () => {
      // テスト実装
    });

    it('should detect form value changes', () => {
      // テスト実装
    });
  });

  describe('session management', () => {
    it('should start session correctly', () => {
      // テスト実装
    });

    it('should end session correctly', () => {
      // テスト実装
    });

    it('should handle multiple sessions', () => {
      // テスト実装
    });
  });
});
```

#### 検証方法
- [ ] 全てのテストケースが通過することを確認
- [ ] カバレッジが80%以上であることを確認
- [ ] エッジケースが適切にテストされていることを確認

---

### Task 6.2: OperationSemanticAnalyzer単体テスト
**優先度**: 🔴 高
**期間**: 2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] `OperationSemanticAnalyzer`の単体テスト作成
- [ ] パターン検出機能のテスト
- [ ] ユーザー意図分析のテスト
- [ ] 操作グループ化のテスト
- [ ] 成功判定のテスト

#### 実装ファイル
- `apps/app/src/renderer/utils/__tests__/OperationSemanticAnalyzer.test.ts`
- `apps/api/src/scenarios/utils/__tests__/OperationSemanticAnalyzer.test.ts`

#### テストケース
```typescript
describe('OperationSemanticAnalyzer', () => {
  let analyzer: OperationSemanticAnalyzer;

  beforeEach(() => {
    analyzer = new OperationSemanticAnalyzer();
  });

  describe('pattern detection', () => {
    it('should detect login pattern correctly', () => {
      const operations = createLoginOperations();
      const intent = analyzer.analyzeUserIntent(operations);

      expect(intent.category).toBe('authentication');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    it('should detect search pattern correctly', () => {
      const operations = createSearchOperations();
      const intent = analyzer.analyzeUserIntent(operations);

      expect(intent.category).toBe('search');
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    it('should detect form pattern correctly', () => {
      const operations = createFormOperations();
      const intent = analyzer.analyzeUserIntent(operations);

      expect(intent.category).toBe('data_entry');
      expect(intent.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('operation grouping', () => {
    it('should group related operations by time', () => {
      const operations = createTimeBasedOperations();
      const groups = analyzer.groupRelatedOperations(operations);

      expect(groups).toHaveLength(2);
      expect(groups[0].operations).toHaveLength(3);
    });

    it('should handle single operation', () => {
      const operations = [createSingleOperation()];
      const groups = analyzer.groupRelatedOperations(operations);

      expect(groups).toHaveLength(1);
      expect(groups[0].operations).toHaveLength(1);
    });
  });
});
```

#### 検証方法
- [ ] パターン検出の精度が期待値以上であることを確認
- [ ] 操作グループ化が適切であることを確認
- [ ] 信頼度計算が正確であることを確認

---

### Task 6.3: API拡張機能単体テスト
**優先度**: 🔴 高
**期間**: 3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 拡張されたScenariosServiceのテスト
- [ ] 新しいエンドポイントのテスト
- [ ] コンテキスト構築機能のテスト
- [ ] コード生成機能のテスト

#### 実装ファイル
- `apps/api/src/scenarios/__tests__/scenarios.service.enhanced.test.ts`
- `apps/api/src/scenarios/__tests__/scenarios.controller.enhanced.test.ts`

#### テストケース
```typescript
describe('ScenariosService Enhanced', () => {
  let service: ScenariosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ScenariosService, PrismaService],
    }).compile();

    service = module.get<ScenariosService>(ScenariosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('buildEnhancedContext', () => {
    it('should build context with session data', async () => {
      const projectId = 'test-project';
      const sessionId = 'test-session';

      const context = await service.buildEnhancedContext(projectId, sessionId);

      expect(context).toHaveProperty('labels');
      expect(context).toHaveProperty('uiStateTransitions');
      expect(context).toHaveProperty('userIntent');
    });

    it('should handle missing session data', async () => {
      const projectId = 'test-project';

      const context = await service.buildEnhancedContext(projectId);

      expect(context.uiStateTransitions).toHaveLength(0);
      expect(context.userIntent.category).toBe('other');
    });
  });

  describe('generateEnhancedCode', () => {
    it('should generate code with enhanced context', async () => {
      const dto = createEnhancedGenerateCodeDto();

      const result = await service.generateEnhancedCode(dto);

      expect(result.code).toContain('waitForSelector');
      expect(result.transitionsUsed).toBeGreaterThan(0);
    });
  });
});
```

#### 検証方法
- [ ] 全ての新機能が正常にテストされていることを確認
- [ ] エラーケースが適切にハンドリングされていることを確認
- [ ] パフォーマンスが許容範囲内であることを確認

---

## Phase 2: 統合テスト実装

### Task 6.4: フロントエンド・バックエンド統合テスト
**優先度**: 🔴 高
**期間**: 3日
**担当者**: フルスタック開発者

#### 実装内容
- [ ] BrowserPage.tsxとAPIの統合テスト
- [ ] UI状態追跡からコード生成までの一連のフロー
- [ ] セッション管理の統合テスト
- [ ] エラーハンドリングの統合テスト

#### 実装ファイル
- `apps/app/src/__tests__/integration/ui-state-tracking.integration.test.ts`

#### テストケース
```typescript
describe('UI State Tracking Integration', () => {
  let app: Application;
  let apiServer: INestApplication;

  beforeAll(async () => {
    // ElectronアプリとAPIサーバーの起動
    app = await startElectronApp();
    apiServer = await startApiServer();
  });

  afterAll(async () => {
    await app.stop();
    await apiServer.close();
  });

  it('should track UI state and generate code', async () => {
    // 1. セッション開始
    await app.client.click('[data-testid="start-session"]');

    // 2. ブラウザ操作の実行
    await simulateUserOperations(app);

    // 3. セッション終了
    await app.client.click('[data-testid="end-session"]');

    // 4. コード生成
    const response = await generateCodeFromSession();

    // 5. 検証
    expect(response.code).toContain('waitForSelector');
    expect(response.transitionsUsed).toBeGreaterThan(0);
  });

  it('should handle session errors gracefully', async () => {
    // エラーケースのテスト
  });
});
```

#### 検証方法
- [ ] 一連のフローが正常に動作することを確認
- [ ] データの整合性が保たれていることを確認
- [ ] エラー時の復旧が適切であることを確認

---

### Task 6.5: データベース統合テスト
**優先度**: 🔴 高
**期間**: 2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 新しいテーブルとの統合テスト
- [ ] データ整合性のテスト
- [ ] パフォーマンステスト
- [ ] マイグレーションテスト

#### 実装ファイル
- `apps/api/src/__tests__/integration/database.integration.test.ts`

#### テストケース
```typescript
describe('Database Integration', () => {
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = new PrismaService();
    await prisma.cleanDatabase();
  });

  describe('OperationSession and UIStateTransition', () => {
    it('should create session with transitions', async () => {
      const project = await createTestProject(prisma);
      const session = await createTestSession(prisma, project.id);
      const transitions = await createTestTransitions(prisma, session.id);

      expect(session).toBeDefined();
      expect(transitions).toHaveLength(3);
    });

    it('should maintain referential integrity', async () => {
      // 参照整合性のテスト
    });

    it('should handle cascade deletes correctly', async () => {
      // カスケード削除のテスト
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // 大量データのパフォーマンステスト
    });
  });
});
```

#### 検証方法
- [ ] データベース操作が正常に動作することを確認
- [ ] パフォーマンスが許容範囲内であることを確認
- [ ] データ整合性が保たれていることを確認

---

## Phase 3: エンドツーエンドテスト実装

### Task 6.6: 実際のWebアプリケーションでのテスト
**優先度**: 🔴 高
**期間**: 4日
**担当者**: QAエンジニア・開発者

#### 実装内容
- [ ] 実際のWebサイトでのテスト環境構築
- [ ] 様々なUIパターンでのテスト
- [ ] 生成精度の測定
- [ ] 実行成功率の測定

#### 実装ファイル
- `apps/app/src/__tests__/e2e/real-world-scenarios.e2e.test.ts`

#### テストケース
```typescript
describe('Real World Scenarios E2E', () => {
  const testSites = [
    'https://example-ecommerce.com',
    'https://example-blog.com',
    'https://example-dashboard.com'
  ];

  testSites.forEach(siteUrl => {
    describe(`Testing on ${siteUrl}`, () => {
      it('should handle login flow', async () => {
        // ログインフローのテスト
        const result = await testLoginFlow(siteUrl);
        expect(result.success).toBe(true);
        expect(result.generatedCode).toContain('waitForSelector');
      });

      it('should handle search functionality', async () => {
        // 検索機能のテスト
        const result = await testSearchFlow(siteUrl);
        expect(result.success).toBe(true);
      });

      it('should handle form submission', async () => {
        // フォーム送信のテスト
        const result = await testFormFlow(siteUrl);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Quality Metrics', () => {
    it('should achieve target generation accuracy', async () => {
      const results = await runQualityTests();
      const accuracy = calculateAccuracy(results);

      expect(accuracy).toBeGreaterThanOrEqual(0.8); // 80%以上
    });

    it('should achieve target execution success rate', async () => {
      const results = await runExecutionTests();
      const successRate = calculateSuccessRate(results);

      expect(successRate).toBeGreaterThanOrEqual(0.85); // 85%以上
    });
  });
});
```

#### 検証方法
- [ ] 実際のWebサイトで正常に動作することを確認
- [ ] 目標とする品質指標を達成していることを確認
- [ ] 様々なUIパターンに対応できることを確認

---

## Phase 4: パフォーマンステスト実装

### Task 6.7: パフォーマンステスト実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: 開発者・QAエンジニア

#### 実装内容
- [ ] UI状態追跡のパフォーマンステスト
- [ ] コード生成速度のテスト
- [ ] メモリ使用量のテスト
- [ ] 大量データ処理のテスト

#### 実装ファイル
- `apps/app/src/__tests__/performance/ui-state-tracking.perf.test.ts`
- `apps/api/src/__tests__/performance/code-generation.perf.test.ts`

#### テストケース
```typescript
describe('Performance Tests', () => {
  describe('UI State Tracking Performance', () => {
    it('should track state changes within acceptable time', async () => {
      const startTime = performance.now();

      // 大量の状態変化をシミュレート
      await simulateMassiveStateChanges(1000);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 5秒以内
    });

    it('should maintain memory usage within limits', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 長時間の操作をシミュレート
      await simulateLongRunningOperations();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB以内
    });
  });

  describe('Code Generation Performance', () => {
    it('should generate code within target time', async () => {
      const startTime = performance.now();

      const result = await generateCodeWithLargeContext();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // 30秒以内
      expect(result.code).toBeDefined();
    });
  });
});
```

#### 検証方法
- [ ] パフォーマンス要件を満たしていることを確認
- [ ] メモリリークがないことを確認
- [ ] 大量データでも安定動作することを確認

---

### Task 6.8: 負荷テスト実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: QAエンジニア

#### 実装内容
- [ ] 同時セッション処理のテスト
- [ ] API負荷テスト
- [ ] データベース負荷テスト
- [ ] システム全体の負荷テスト

#### 実装ファイル
- `apps/api/src/__tests__/load/api-load.test.ts`

#### テストケース
```typescript
describe('Load Tests', () => {
  describe('Concurrent Sessions', () => {
    it('should handle multiple sessions simultaneously', async () => {
      const sessionCount = 10;
      const promises = [];

      for (let i = 0; i < sessionCount; i++) {
        promises.push(simulateUserSession(`session-${i}`));
      }

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('API Load', () => {
    it('should handle high request volume', async () => {
      const requestCount = 100;
      const promises = [];

      for (let i = 0; i < requestCount; i++) {
        promises.push(makeCodeGenerationRequest());
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      expect(successCount / requestCount).toBeGreaterThan(0.95); // 95%成功率
    });
  });
});
```

#### 検証方法
- [ ] 高負荷時でも安定動作することを確認
- [ ] レスポンス時間が許容範囲内であることを確認
- [ ] エラー率が許容範囲内であることを確認

---

## Phase 5: 品質検証

### Task 6.9: 品質指標測定実装
**優先度**: 🔴 高
**期間**: 3日
**担当者**: QAエンジニア・開発者

#### 実装内容
- [ ] 生成精度測定システム
- [ ] 動的要素対応率測定
- [ ] 実行成功率測定
- [ ] 品質レポート生成

#### 実装ファイル
- `apps/api/src/quality/quality-metrics.service.ts`
- `apps/app/src/__tests__/quality/quality-measurement.test.ts`

#### 実装詳細
```typescript
export class QualityMetricsService {
  async measureGenerationAccuracy(testCases: TestCase[]): Promise<QualityReport> {
    const results = [];

    for (const testCase of testCases) {
      const generatedCode = await this.generateCode(testCase);
      const executionResult = await this.executeCode(generatedCode);
      const manualReviewResult = await this.manualReview(generatedCode);

      results.push({
        testCase: testCase.id,
        generated: !!generatedCode,
        executable: executionResult.success,
        needsManualFix: !manualReviewResult.passesWithoutModification,
        dynamicElementsHandled: this.countDynamicElements(generatedCode),
        qualityScore: this.calculateQualityScore(generatedCode, executionResult)
      });
    }

    return this.generateQualityReport(results);
  }

  private calculateQualityScore(code: string, execution: ExecutionResult): number {
    let score = 0;

    // 実行成功
    if (execution.success) score += 40;

    // 堅牢なセレクタ使用
    if (this.hasRobustSelectors(code)) score += 20;

    // 適切な待機処理
    if (this.hasProperWaits(code)) score += 20;

    // エラーハンドリング
    if (this.hasErrorHandling(code)) score += 10;

    // コード品質
    if (this.hasGoodStructure(code)) score += 10;

    return score;
  }
}
```

#### 検証方法
- [ ] 品質指標が正確に測定されることを確認
- [ ] 目標値を達成していることを確認
- [ ] レポートが有用な情報を提供することを確認

---

## 完了基準

### Phase 1完了基準
- [ ] 全ての単体テストが実装され、通過している
- [ ] コードカバレッジが80%以上である
- [ ] エッジケースが適切にテストされている

### Phase 2完了基準
- [ ] 統合テストが実装され、通過している
- [ ] データ整合性が保たれている
- [ ] エラーハンドリングが適切である

### Phase 3完了基準
- [ ] E2Eテストが実装され、通過している
- [ ] 実際のWebサイトで正常動作する
- [ ] 目標品質指標を達成している

### Phase 4-5完了基準
- [ ] パフォーマンステストが通過している
- [ ] 品質測定システムが動作している
- [ ] 継続的な品質監視が可能である

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `07-performance-optimization-tasks.md`
- `08-deployment-and-monitoring-tasks.md`