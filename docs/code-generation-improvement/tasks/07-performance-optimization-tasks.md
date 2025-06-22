# パフォーマンス最適化タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](../../DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- テストケース名は日本語で記述

## Phase 1: フロントエンド最適化

### Task 7.1: UI状態追跡パフォーマンス最適化
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] DOMスナップショット処理の最適化
- [ ] Observer処理の効率化
- [ ] メモリ使用量の削減
- [ ] 非同期処理の最適化

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 最適化詳細
```typescript
export class AdvancedUIStateTracker {
  private snapshotCache = new Map<string, DOMSnapshot>();
  private processingQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  
  // データ量制限による最適化
  private optimizeSnapshot(snapshot: DOMSnapshot): DOMSnapshot {
    return {
      ...snapshot,
      visibleElements: snapshot.visibleElements.slice(0, 100), // 最大100要素
      hiddenElements: snapshot.hiddenElements.slice(0, 50),   // 最大50要素
      formValues: this.limitFormValues(snapshot.formValues, 20) // 最大20フィールド
    };
  }
  
  // 非同期キューによる処理最適化
  private async queueOperation(operation: () => Promise<void>): Promise<void> {
    this.processingQueue.push(operation);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const operation = this.processingQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Queue operation failed:', error);
        }
      }
      
      // 他の処理に制御を譲る
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    this.isProcessing = false;
  }
  
  // キャッシュによる重複処理回避
  private async captureSnapshotWithCache(): Promise<DOMSnapshot> {
    const cacheKey = this.generateSnapshotCacheKey();
    
    if (this.snapshotCache.has(cacheKey)) {
      return this.snapshotCache.get(cacheKey)!;
    }
    
    const snapshot = await this.captureSnapshot();
    const optimizedSnapshot = this.optimizeSnapshot(snapshot);
    
    // キャッシュサイズ制限
    if (this.snapshotCache.size > 10) {
      const firstKey = this.snapshotCache.keys().next().value;
      this.snapshotCache.delete(firstKey);
    }
    
    this.snapshotCache.set(cacheKey, optimizedSnapshot);
    return optimizedSnapshot;
  }
}
```

#### 検証方法
- [ ] メモリ使用量が50%削減されていることを確認
- [ ] 処理速度が30%向上していることを確認
- [ ] UI応答性が維持されていることを確認

---

### Task 7.2: Observer処理最適化
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] MutationObserverの効率化
- [ ] IntersectionObserverの最適化
- [ ] 不要なイベント処理の削減
- [ ] デバウンス処理の実装

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 最適化詳細
```typescript
// デバウンス処理による最適化
private setupOptimizedObservers(): void {
  // MutationObserver with debouncing
  let mutationTimeout: NodeJS.Timeout;
  this.mutationObserver = new MutationObserver((mutations) => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
      this.processMutations(mutations);
    }, 100); // 100ms デバウンス
  });
  
  // IntersectionObserver with throttling
  let lastIntersectionTime = 0;
  this.intersectionObserver = new IntersectionObserver((entries) => {
    const now = Date.now();
    if (now - lastIntersectionTime > 200) { // 200ms スロットリング
      this.processIntersections(entries);
      lastIntersectionTime = now;
    }
  }, {
    threshold: [0, 1.0], // 閾値を削減
    rootMargin: '10px' // マージンを最小化
  });
}

// 重要な変更のみをフィルタリング
private processMutations(mutations: MutationRecord[]): void {
  const significantMutations = mutations.filter(mutation => {
    // 重要でない変更を除外
    if (mutation.type === 'attributes') {
      const ignoredAttributes = ['style', 'class'];
      return !ignoredAttributes.includes(mutation.attributeName || '');
    }
    
    if (mutation.type === 'childList') {
      // 小さなテキスト変更を除外
      return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
    }
    
    return true;
  });
  
  if (significantMutations.length > 0) {
    this.queueOperation(() => this.handleSignificantChanges(significantMutations));
  }
}
```

#### 検証方法
- [ ] Observer処理のCPU使用率が削減されていることを確認
- [ ] 不要なイベント処理が削減されていることを確認
- [ ] デバウンス処理が正常に動作することを確認

---

## Phase 2: バックエンド最適化

### Task 7.3: データベースクエリ最適化
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] N+1クエリ問題の解決
- [ ] インデックスの最適化
- [ ] クエリの効率化
- [ ] データベース接続プールの最適化

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`
- `apps/api/prisma/schema.prisma`

#### 最適化詳細
```typescript
// N+1クエリ問題の解決
async buildEnhancedContext(projectId: string, sessionId?: string) {
  // 一度のクエリで関連データを全て取得
  const [labels, uiStateTransitions, operationSession] = await Promise.all([
    this.prisma.label.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        description: true,
        selector: true,
        elementText: true,
        isDynamic: true,
        triggerActions: true
      }
    }),
    
    sessionId ? this.prisma.uiStateTransition.findMany({
      where: { sessionId },
      include: {
        fromUIState: {
          select: { id: true, title: true, pageUrl: true }
        },
        toUIState: {
          select: { id: true, title: true, pageUrl: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    }) : [],
    
    sessionId ? this.prisma.operationSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { uiStateTransitions: true }
        }
      }
    }) : null
  ]);
  
  // 後続処理...
}

// バッチ処理による最適化
async processMultipleTransitions(transitions: UIStateTransition[]): Promise<void> {
  const batchSize = 50;
  const batches = this.chunkArray(transitions, batchSize);
  
  for (const batch of batches) {
    await this.prisma.uiStateTransition.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
}
```

#### インデックス最適化
```sql
-- パフォーマンス向上のためのインデックス追加
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ui_state_transitions_session_timestamp_idx" 
ON "ui_state_transitions"("sessionId", "timestamp");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ui_state_transitions_project_timestamp_idx" 
ON "ui_state_transitions"("projectId", "timestamp");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "operation_sessions_project_status_start_idx" 
ON "operation_sessions"("projectId", "status", "startTime");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "labels_project_dynamic_idx" 
ON "labels"("projectId", "isDynamic");
```

#### 検証方法
- [ ] クエリ実行時間が50%短縮されていることを確認
- [ ] N+1クエリが解消されていることを確認
- [ ] インデックスが効果的に使用されていることを確認

---

### Task 7.4: LLM API最適化
**優先度**: 🔴 高
**期間**: 2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] プロンプトサイズの最適化
- [ ] レスポンスキャッシュの実装
- [ ] 並列処理の最適化
- [ ] エラーハンドリングの改善

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`
- `apps/api/src/scenarios/utils/llm-cache.service.ts`

#### 最適化詳細
```typescript
export class LLMCacheService {
  private cache = new Map<string, { result: string; timestamp: number }>();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1時間
  
  async getCachedResult(prompt: string): Promise<string | null> {
    const cacheKey = this.generateCacheKey(prompt);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    
    return null;
  }
  
  async setCachedResult(prompt: string, result: string): Promise<void> {
    const cacheKey = this.generateCacheKey(prompt);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    // キャッシュサイズ制限
    if (this.cache.size > 1000) {
      this.cleanupOldEntries();
    }
  }
  
  private generateCacheKey(prompt: string): string {
    // プロンプトの重要部分のみでキーを生成
    const hash = crypto.createHash('sha256');
    hash.update(prompt);
    return hash.digest('hex');
  }
}

// プロンプト最適化
private optimizePrompt(context: any): string {
  // 不要な情報を削除してプロンプトサイズを削減
  const optimizedContext = {
    ...context,
    uiStateTransitions: context.uiStateTransitions.slice(-10), // 最新10件のみ
    labels: context.labels.slice(0, 50), // 最大50ラベル
    performanceMetrics: this.summarizeMetrics(context.performanceMetrics)
  };
  
  return this.buildEnhancedPrompt(context.scenario, optimizedContext, context.url);
}
```

#### 検証方法
- [ ] LLM API呼び出し時間が30%短縮されていることを確認
- [ ] キャッシュヒット率が60%以上であることを確認
- [ ] プロンプトサイズが適切に削減されていることを確認

---

## Phase 3: システム全体最適化

### Task 7.5: メモリ使用量最適化
**優先度**: 🟡 中
**期間**: 2日
**担当者**: フルスタック開発者

#### 実装内容
- [ ] メモリリークの検出と修正
- [ ] オブジェクトプールの実装
- [ ] ガベージコレクション最適化
- [ ] メモリ使用量監視

#### 実装ファイル
- `apps/app/src/renderer/utils/memory-optimizer.ts`
- `apps/api/src/common/memory-monitor.service.ts`

#### 最適化詳細
```typescript
export class MemoryOptimizer {
  private objectPool = new Map<string, any[]>();
  
  // オブジェクトプールによるメモリ最適化
  getPooledObject<T>(type: string, factory: () => T): T {
    const pool = this.objectPool.get(type) || [];
    
    if (pool.length > 0) {
      return pool.pop() as T;
    }
    
    return factory();
  }
  
  returnToPool<T>(type: string, obj: T): void {
    const pool = this.objectPool.get(type) || [];
    
    if (pool.length < 100) { // プールサイズ制限
      // オブジェクトをリセット
      this.resetObject(obj);
      pool.push(obj);
      this.objectPool.set(type, pool);
    }
  }
  
  // 定期的なメモリクリーンアップ
  scheduleCleanup(): void {
    setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000); // 5分ごと
  }
  
  private performCleanup(): void {
    // 古いキャッシュエントリの削除
    this.cleanupCaches();
    
    // 未使用オブジェクトの削除
    this.cleanupObjectPools();
    
    // 強制ガベージコレクション（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      if (global.gc) {
        global.gc();
      }
    }
  }
}
```

#### 検証方法
- [ ] メモリ使用量が安定していることを確認
- [ ] メモリリークがないことを確認
- [ ] オブジェクトプールが効果的に動作することを確認

---

### Task 7.6: ネットワーク通信最適化
**優先度**: 🟡 中
**期間**: 1-2日
**担当者**: フルスタック開発者

#### 実装内容
- [ ] データ圧縮の実装
- [ ] バッチ処理の最適化
- [ ] 接続プールの最適化
- [ ] リクエスト重複排除

#### 実装ファイル
- `apps/app/src/renderer/services/api-client.ts`
- `apps/api/src/common/compression.middleware.ts`

#### 最適化詳細
```typescript
export class OptimizedApiClient {
  private requestQueue = new Map<string, Promise<any>>();
  private batchQueue: Array<{ data: any; resolve: Function; reject: Function }> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  // リクエスト重複排除
  async request<T>(url: string, options: RequestOptions): Promise<T> {
    const requestKey = this.generateRequestKey(url, options);
    
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }
    
    const promise = this.executeRequest<T>(url, options);
    this.requestQueue.set(requestKey, promise);
    
    // 完了後にキューから削除
    promise.finally(() => {
      this.requestQueue.delete(requestKey);
    });
    
    return promise;
  }
  
  // バッチ処理による最適化
  async batchRequest(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ data, resolve, reject });
      
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, 100); // 100ms でバッチ処理
    });
  }
  
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue.length = 0;
    
    try {
      const results = await this.executeBatchRequest(batch.map(item => item.data));
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
}
```

#### 検証方法
- [ ] ネットワーク通信量が30%削減されていることを確認
- [ ] レスポンス時間が改善されていることを確認
- [ ] バッチ処理が効果的に動作することを確認

---

## Phase 4: 監視・測定システム

### Task 7.7: パフォーマンス監視システム実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: 開発者

#### 実装内容
- [ ] リアルタイムパフォーマンス監視
- [ ] メトリクス収集システム
- [ ] アラート機能
- [ ] パフォーマンスダッシュボード

#### 実装ファイル
- `apps/api/src/monitoring/performance-monitor.service.ts`
- `apps/app/src/renderer/utils/performance-tracker.ts`

#### 実装詳細
```typescript
export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();
  
  startMeasurement(name: string): PerformanceMeasurement {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    return {
      name,
      startTime,
      startMemory,
      end: () => this.endMeasurement(name, startTime, startMemory)
    };
  }
  
  private endMeasurement(
    name: string, 
    startTime: number, 
    startMemory: NodeJS.MemoryUsage
  ): PerformanceResult {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const result = {
      name,
      duration: endTime - startTime,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
      timestamp: new Date().toISOString()
    };
    
    this.recordMetric(result);
    this.checkThresholds(result);
    
    return result;
  }
  
  private checkThresholds(result: PerformanceResult): void {
    const thresholds = this.getThresholds(result.name);
    
    if (result.duration > thresholds.maxDuration) {
      this.sendAlert(`Performance threshold exceeded: ${result.name} took ${result.duration}ms`);
    }
    
    if (result.memoryDelta > thresholds.maxMemoryDelta) {
      this.sendAlert(`Memory threshold exceeded: ${result.name} used ${result.memoryDelta} bytes`);
    }
  }
}
```

#### 検証方法
- [ ] パフォーマンス監視が正常に動作することを確認
- [ ] アラート機能が適切に動作することを確認
- [ ] ダッシュボードが有用な情報を提供することを確認

---

## 完了基準

### Phase 1完了基準
- [ ] フロントエンドのパフォーマンスが30%向上している
- [ ] メモリ使用量が50%削減されている
- [ ] UI応答性が維持されている

### Phase 2完了基準
- [ ] データベースクエリが50%高速化されている
- [ ] LLM API呼び出しが30%高速化されている
- [ ] キャッシュ機能が効果的に動作している

### Phase 3完了基準
- [ ] システム全体のメモリ使用量が最適化されている
- [ ] ネットワーク通信が効率化されている
- [ ] 全体的なパフォーマンスが向上している

### Phase 4完了基準
- [ ] パフォーマンス監視システムが動作している
- [ ] 継続的な最適化が可能である
- [ ] 問題の早期発見が可能である

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `08-deployment-and-monitoring-tasks.md`
- `09-documentation-and-training-tasks.md`
