# BrowserPage.tsx 改善実装タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 🚨 実装開始前の必須チェック（Rule 10）
- [ ] **テスト設計**: テストケースが全て定義済み（it.todoでも可）
- [ ] **型定義確認**: Prisma型・共通型の再利用を確認
- [ ] **技術選択**: tRPC・共通パッケージの使用を確認
- [ ] **依存関係**: 前提タスクと影響範囲を確認

### 🚨 テストファースト開発（Rule 12）
- [ ] **実装前**: 必ずテストファイルを作成
- [ ] **テスト網羅**: 正常系・異常系・境界値を網羅
- [ ] **TDD実践**: Red→Green→Refactorサイクル

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- Reactテストは Testing Library を使用し、アクセシビリティを重視

## Phase 1: AdvancedUIStateTracker実装

### Task 2.1: 基本クラス構造実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] `AdvancedUIStateTracker`クラスの基本構造作成
- [ ] 必要なインターフェース定義
  - `DOMSnapshot`
  - `TriggerAction`
  - `UIStateTransition`
- [ ] 基本的なコンストラクタとメソッド定義

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`
- `apps/app/src/renderer/types/ui-state.types.ts`

#### 実装詳細
```typescript
export class AdvancedUIStateTracker {
  private mutationObserver: MutationObserver;
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver;
  private currentSession: string | null = null;
  private lastSnapshot: DOMSnapshot | null = null;
  
  constructor(private webview: Electron.WebviewTag) {
    this.setupObservers();
  }
  
  startSession(sessionId: string, userGoal?: string): void
  endSession(): void
  recordTransition(triggerAction: TriggerAction): void
}
```

#### 検証方法
- [ ] TypeScriptコンパイルエラーがないことを確認
- [ ] 基本的なインスタンス化が可能であることを確認

---

### Task 2.2: DOMスナップショット機能実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] `captureSnapshot()`メソッド実装
- [ ] 可視要素の取得機能
- [ ] 非表示要素の取得機能
- [ ] フォーム値の取得機能
- [ ] スクロール位置の取得機能
- [ ] アクティブ要素の取得機能

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
private captureSnapshot(): DOMSnapshot {
  return this.webview.executeJavaScript(`
    (() => {
      const visibleElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map(el => this.generateSelector(el))
        .slice(0, 100);
      
      // その他の情報取得...
      
      return {
        visibleElements,
        hiddenElements,
        formValues,
        scrollPosition: { x: window.scrollX, y: window.scrollY },
        activeElement: document.activeElement ? this.generateSelector(document.activeElement) : ''
      };
    })()
  `);
}
```

#### 検証方法
- [ ] 各種要素が正しく取得できることを確認
- [ ] パフォーマンスが許容範囲内であることを確認
- [ ] メモリリークがないことを確認

---

### Task 2.3: 状態差分計算機能実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] `calculateStateDiff()`メソッド実装
- [ ] 新規表示要素の検出
- [ ] 削除要素の検出
- [ ] 変更要素の検出
- [ ] フォーム値変更の検出

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
private calculateStateDiff(before: DOMSnapshot, after: DOMSnapshot): Partial<DOMSnapshot> {
  const newElements = after.visibleElements.filter(el => 
    !before.visibleElements.includes(el)
  );
  
  const removedElements = before.visibleElements.filter(el => 
    !after.visibleElements.includes(el)
  );
  
  const modifiedElements = [];
  // フォーム値の変更を検出
  for (const [key, afterValue] of Object.entries(after.formValues)) {
    const beforeValue = before.formValues[key];
    if (beforeValue !== afterValue) {
      modifiedElements.push({
        selector: `[name="${key}"], #${key}`,
        changes: { value: { from: beforeValue, to: afterValue } }
      });
    }
  }
  
  return { newElements, removedElements, modifiedElements };
}
```

#### 検証方法
- [ ] 差分計算が正確であることを確認
- [ ] パフォーマンスが許容範囲内であることを確認

---

### Task 2.4: Observer統合システム実装
**優先度**: 🟡 中
**期間**: 2-3日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] MutationObserver拡張実装
- [ ] IntersectionObserver統合実装
- [ ] ResizeObserver統合実装
- [ ] 重要な変更のフィルタリング機能

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
private setupObservers(): void {
  // MutationObserver for DOM changes
  this.mutationObserver = new MutationObserver((mutations) => {
    const significantChanges = mutations.filter(mutation => 
      mutation.type === 'childList' && mutation.addedNodes.length > 0
    );
    
    if (significantChanges.length > 0) {
      this.recordDOMChange(significantChanges);
    }
  });
  
  // IntersectionObserver for visibility changes
  this.intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.recordVisibilityChange(entry.target, 'visible');
      } else {
        this.recordVisibilityChange(entry.target, 'hidden');
      }
    });
  });
  
  // ResizeObserver for element size changes
  this.resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(entry => {
      this.recordSizeChange(entry.target, entry.contentRect);
    });
  });
}
```

#### 検証方法
- [ ] 各Observerが正しく動作することを確認
- [ ] パフォーマンスへの影響が最小限であることを確認

---

## Phase 2: セッション管理機能実装

### Task 2.5: セッション管理機能実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] `startSession()`メソッド実装
- [ ] `endSession()`メソッド実装
- [ ] セッション状態管理
- [ ] APIとの通信機能

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
startSession(sessionId: string, userGoal?: string): void {
  this.currentSession = sessionId;
  this.lastSnapshot = this.captureSnapshot();
  
  // セッション開始をAPIに通知
  window.api.send('start-operation-session', {
    sessionId,
    userGoal,
    initialSnapshot: this.lastSnapshot
  });
}

endSession(): void {
  if (this.currentSession) {
    window.api.send('end-operation-session', {
      sessionId: this.currentSession
    });
    this.currentSession = null;
    this.lastSnapshot = null;
  }
}
```

#### 検証方法
- [ ] セッション開始・終了が正しく動作することを確認
- [ ] APIとの通信が正常であることを確認

---

### Task 2.6: 状態変遷記録機能実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] `recordTransition()`メソッド実装
- [ ] トリガーアクション記録
- [ ] before/after状態の記録
- [ ] メタデータ収集機能

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
recordTransition(triggerAction: TriggerAction): void {
  if (!this.currentSession) return;
  
  const beforeState = this.lastSnapshot || this.captureSnapshot();
  
  // DOM変更を待ってからafter状態をキャプチャ
  setTimeout(() => {
    const afterState = this.captureSnapshot();
    const diff = this.calculateStateDiff(beforeState, afterState);
    
    const transition: UIStateTransition = {
      sessionId: this.currentSession!,
      triggerAction,
      beforeState,
      afterState: { ...afterState, ...diff },
      metadata: this.captureMetadata(),
      timestamp: new Date().toISOString()
    };
    
    // APIに送信
    window.api.send('record-ui-state-transition', transition);
    
    this.lastSnapshot = afterState;
  }, 100); // DOM変更の完了を待つ
}
```

#### 検証方法
- [ ] 状態変遷が正確に記録されることを確認
- [ ] APIへの送信が正常であることを確認

---

## Phase 3: BrowserPage.tsx統合

### Task 2.7: 既存コードとの統合
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] 既存MutationObserverの置き換え
- [ ] 既存recordUserAction関数の拡張
- [ ] イベントハンドリングの統合
- [ ] 状態管理の統合

#### 実装ファイル
- `apps/app/src/renderer/pages/BrowserPage.tsx`

#### 実装詳細
```typescript
// BrowserPage.tsx内での統合
const [uiStateTracker, setUiStateTracker] = useState<AdvancedUIStateTracker | null>(null);

useEffect(() => {
  const webview = webviewRef.current;
  if (webview) {
    const tracker = new AdvancedUIStateTracker(webview);
    setUiStateTracker(tracker);
    
    // セッション開始
    tracker.startSession(`session_${Date.now()}`, 'ブラウザ操作');
    
    return () => {
      tracker.endSession();
    };
  }
}, []);

// 既存のrecordUserAction関数を拡張
const recordUserAction = (type: string, element: any, additionalData = {}) => {
  const actionData = {
    type,
    selector: generateSelector(element),
    text: element.textContent?.trim().substring(0, 50) || '',
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // UI状態追跡システムに記録
  if (uiStateTracker) {
    uiStateTracker.recordTransition(actionData);
  }
  
  // 既存のログ出力も維持
  console.log('[EVENT] USER_ACTION:' + JSON.stringify(actionData));
};
```

#### 検証方法
- [ ] 既存機能が正常に動作することを確認
- [ ] 新機能が正しく統合されていることを確認
- [ ] パフォーマンスが劣化していないことを確認

---

## Phase 4: パフォーマンス最適化

### Task 2.8: パフォーマンス最適化
**優先度**: 🟡 中
**期間**: 1-2日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] データ量制限機能
- [ ] 非同期処理最適化
- [ ] メモリ使用量最適化
- [ ] 不要なObserver停止機能

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
private optimizeSnapshot(snapshot: DOMSnapshot): DOMSnapshot {
  return {
    ...snapshot,
    visibleElements: snapshot.visibleElements.slice(0, 100),
    hiddenElements: snapshot.hiddenElements.slice(0, 50),
    formValues: this.limitFormValues(snapshot.formValues)
  };
}

private async captureSnapshotAsync(): Promise<DOMSnapshot> {
  return new Promise((resolve) => {
    requestIdleCallback(() => {
      const snapshot = this.captureSnapshot();
      resolve(this.optimizeSnapshot(snapshot));
    });
  });
}
```

#### 検証方法
- [ ] メモリ使用量が許容範囲内であることを確認
- [ ] CPU使用率が許容範囲内であることを確認
- [ ] レスポンス性が維持されていることを確認

---

## Phase 5: セキュリティ対応

### Task 2.9: セキュリティ機能実装
**優先度**: 🟡 中
**期間**: 1日
**担当者**: フロントエンド開発者

#### 実装内容
- [ ] 機密情報のマスキング機能
- [ ] パスワードフィールドの保護
- [ ] クレジットカード情報の保護
- [ ] 個人情報の検出と保護

#### 実装ファイル
- `apps/app/src/renderer/utils/AdvancedUIStateTracker.ts`

#### 実装詳細
```typescript
private sanitizeFormValues(formValues: Record<string, string>): Record<string, string> {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formValues)) {
    // パスワードフィールドのマスキング
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('pass')) {
      sanitized[key] = '********';
    }
    // クレジットカード番号のマスキング
    else if (this.isCreditCardNumber(value)) {
      sanitized[key] = '**** **** **** ' + value.slice(-4);
    }
    // その他の機密情報
    else if (this.isSensitiveData(key, value)) {
      sanitized[key] = '[REDACTED]';
    }
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

#### 検証方法
- [ ] 機密情報が適切にマスキングされることを確認
- [ ] 必要な情報は保持されていることを確認

---

## 完了基準

### Phase 1完了基準
- [ ] AdvancedUIStateTrackerクラスが実装されている
- [ ] 基本的なDOMスナップショット機能が動作している
- [ ] 状態差分計算が正確に動作している

### Phase 2完了基準
- [ ] セッション管理機能が実装されている
- [ ] 状態変遷記録機能が動作している
- [ ] APIとの通信が正常に動作している

### Phase 3完了基準
- [ ] 既存のBrowserPage.tsxと統合されている
- [ ] 既存機能が正常に動作している
- [ ] 新機能が正しく動作している

### Phase 4-5完了基準
- [ ] パフォーマンスが最適化されている
- [ ] セキュリティ機能が実装されている
- [ ] 全体的な品質が向上している

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `03-api-enhancement-tasks.md`
- `04-operation-analysis-tasks.md`
