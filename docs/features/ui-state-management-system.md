# UI状態管理システム

## 概要
ページ遷移を伴わない画面状態の変化を追跡・記録し、より精密なテストコード生成を実現するシステムを構築します。

## 背景・目的

### 現在の課題
- **動的コンテンツの未対応**: モーダル、ドロップダウン、タブ切り替え等の状態変化が記録されない
- **操作フローの分断**: ユーザーの一連の操作が途切れて記録される
- **コンテキスト不足**: 操作の前後関係や意図が失われる

### 目的
- **動的コンテンツ対応**: モーダル、ドロップダウン、タブ切り替え等の状態変化を記録
- **操作フローの完全性**: ユーザーの一連の操作を途切れることなく追跡
- **テストコード精度向上**: 実際のユーザー体験に基づいたより現実的なテストケース生成

## 技術仕様

### UIState データモデル

```typescript
interface UIState {
  id: string;
  sessionId: string;
  timestamp: number;
  url: string;
  triggerAction: {
    type: 'click' | 'input' | 'hover' | 'keypress' | 'scroll' | 'focus' | 'blur';
    element: string; // CSS selector
    value?: string;
    coordinates?: { x: number; y: number };
  };
  beforeState: {
    visibleElements: string[]; // 表示されている要素のセレクタ
    hiddenElements: string[]; // 非表示の要素のセレクタ
    formValues: Record<string, string>; // フォームの値
    scrollPosition: { x: number; y: number };
    activeElement: string; // フォーカスされている要素
  };
  afterState: {
    visibleElements: string[];
    hiddenElements: string[];
    formValues: Record<string, string>;
    scrollPosition: { x: number; y: number };
    activeElement: string;
    newElements: string[]; // 新たに表示された要素
    removedElements: string[]; // 非表示になった要素
    modifiedElements: Array<{
      selector: string;
      changes: Record<string, any>;
    }>;
  };
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    loadTime: number;
    networkRequests?: string[]; // 発生したネットワークリクエスト
  };
}
```

### 操作セッション管理

```typescript
interface OperationSession {
  id: string;
  projectId: string;
  startTime: number;
  endTime?: number;
  userGoal?: string; // ユーザーが達成しようとしている目標
  status: 'active' | 'completed' | 'abandoned';
  uiStates: UIState[];
  summary: {
    totalActions: number;
    uniqueElements: string[];
    pageTransitions: number;
    errors: string[];
  };
}
```

## 実装アプローチ

### 1. MutationObserver の活用

```typescript
class UIStateTracker {
  private observer: MutationObserver;
  private currentSession: OperationSession;
  
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }
  
  startTracking(sessionId: string) {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true
    });
  }
  
  private handleMutations(mutations: MutationRecord[]) {
    // DOM変更の分析と状態記録
  }
}
```

### 2. 状態スナップショット機能

```typescript
class StateSnapshot {
  static capture(): UIStateSnapshot {
    return {
      visibleElements: this.getVisibleElements(),
      hiddenElements: this.getHiddenElements(),
      formValues: this.getFormValues(),
      scrollPosition: this.getScrollPosition(),
      activeElement: this.getActiveElement()
    };
  }
  
  static diff(before: UIStateSnapshot, after: UIStateSnapshot): StateDiff {
    // 状態の差分を計算
  }
}
```

### 3. 操作シーケンス管理

```typescript
class OperationSequenceManager {
  private sequences: Map<string, OperationSequence> = new Map();
  
  groupRelatedOperations(operations: UIState[]): OperationSequence[] {
    // 関連する操作をグループ化
    // タイムアウト、要素の関連性、操作タイプを考慮
  }
  
  detectUserIntent(sequence: OperationSequence): string {
    // 操作シーケンスからユーザーの意図を推定
  }
}
```

## データベース設計

### UI状態テーブル
```sql
CREATE TABLE ui_states (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id),
  timestamp TIMESTAMP NOT NULL,
  url TEXT NOT NULL,
  trigger_action JSONB NOT NULL,
  before_state JSONB NOT NULL,
  after_state JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_session_timestamp (session_id, timestamp),
  INDEX idx_project_timestamp (project_id, timestamp)
);
```

### 操作セッションテーブル
```sql
CREATE TABLE operation_sessions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  user_goal TEXT,
  status VARCHAR(50) DEFAULT 'active',
  summary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_project_status (project_id, status),
  INDEX idx_start_time (start_time)
);
```

## API エンドポイント

### セッション管理
```typescript
// セッション開始
POST /api/ui-states/sessions
{
  "projectId": "uuid",
  "userGoal": "ユーザーログイン"
}

// セッション終了
PUT /api/ui-states/sessions/:sessionId/complete

// セッション一覧取得
GET /api/ui-states/sessions?projectId=uuid&status=active
```

### 状態記録
```typescript
// UI状態記録
POST /api/ui-states
{
  "sessionId": "uuid",
  "triggerAction": {...},
  "beforeState": {...},
  "afterState": {...}
}

// 状態履歴取得
GET /api/ui-states?sessionId=uuid&limit=100
```

## LLM統合の改善

### 拡張されたプロンプト設計

```typescript
interface EnhancedPromptContext {
  staticHTML: string; // 従来の静的HTML
  uiStates: UIState[]; // UI状態の変遷
  operationFlow: {
    goal: string; // ユーザーの目標
    steps: Array<{
      action: string;
      element: string;
      result: string;
      timing: number;
    }>;
    patterns: string[]; // 検出されたパターン
  };
  pageContext: {
    url: string;
    title: string;
    dynamicElements: string[]; // 動的に変化する要素
    interactiveElements: string[]; // インタラクティブな要素
  };
  sessionMetadata: {
    duration: number;
    errorCount: number;
    retryCount: number;
  };
}
```

### プロンプトテンプレート例

```typescript
const ENHANCED_PROMPT_TEMPLATE = `
以下の情報を基に、Playwrightテストコードを生成してください：

## ユーザーの目標
${context.operationFlow.goal}

## 操作フロー
${context.operationFlow.steps.map(step => 
  `${step.action} → ${step.element} → ${step.result}`
).join('\n')}

## UI状態の変遷
${context.uiStates.map(state => 
  `${state.triggerAction.type}: ${state.triggerAction.element}
   新規表示: ${state.afterState.newElements.join(', ')}
   非表示: ${state.afterState.removedElements.join(', ')}`
).join('\n')}

## 動的要素
${context.pageContext.dynamicElements.join(', ')}

生成するテストコードでは以下を考慮してください：
- 動的要素の表示待機
- 操作間の適切な待機時間
- エラーハンドリング
- 要素の可視性確認
`;
```

## 実装タスク

### フェーズ1: 基盤実装（3-4週間）
- [ ] UIStateTracker クラスの実装
- [ ] MutationObserver ベースの監視システム
- [ ] 基本的な状態スナップショット機能
- [ ] データベーススキーマの実装

### フェーズ2: 高度な分析機能（4-5週間）
- [ ] 操作シーケンス管理システム
- [ ] 状態差分検出アルゴリズム
- [ ] ユーザー意図推定機能
- [ ] API エンドポイントの実装

### フェーズ3: LLM統合（2-3週間）
- [ ] 拡張プロンプト設計
- [ ] コンテキスト情報の構造化
- [ ] テストコード生成ロジックの改善

### フェーズ4: 最適化・検証（2週間）
- [ ] パフォーマンス最適化
- [ ] デバッグ・可視化ツール
- [ ] 実環境での検証

## パフォーマンス考慮事項

### メモリ使用量の最適化
- 状態履歴の適切な制限
- 不要なデータの定期的なクリーンアップ
- 効率的なデータ構造の使用

### 処理速度の最適化
- 非同期処理の活用
- バッチ処理による効率化
- インデックスの適切な設計

## セキュリティ考慮事項

### データ保護
- 機密情報の自動マスキング
- ローカルストレージの暗号化
- アクセス制御の実装

### プライバシー
- ユーザー同意の取得
- データ保持期間の制限
- 匿名化オプションの提供

## 関連ドキュメント
- [Playwrightテストコード生成精度向上](playwright-code-generation-improvement.md)
- [Playwrightコード配布システム](playwright-code-distribution-system.md)
- [仕様書](../SPECIFICATION.md)
- [README.md](../../README.md)
