# Playwrightテストコード生成精度向上

> **注意**: このドキュメントは [`docs/code-generation-improvement/`](../code-generation-improvement/) ディレクトリに移動されました。最新の情報は新しい場所を参照してください。

## 概要
現在のPlaywrightテストコード自動生成機能において、複雑なユーザーインタラクション（モーダル操作、動的コンテンツ等）を含むテストケースの生成精度を向上させます。

## 現在の課題

### 具体例: ログインフローの問題
ルートページ（`/`）からログイン後のページへ遷移する場合の典型的なフロー：

1. ルートページ内のログインボタンをクリック
2. 表示されたモーダル内でメールアドレス・パスワードタブをクリック
3. メールアドレス・パスワードを入力
4. ログインボタンを押下

### 現在の問題点
- **静的解析の限界**: 初回レンダー時のページ状態のみを考慮
- **動的変化の未対応**: モーダル表示やタブ切り替えなどの状態変化を追跡できない
- **フロー分断**: 実際のユーザーフローを反映しないテストコードが生成される
- **コンテキスト不足**: 操作の意図や目的が考慮されない

### 技術的課題
- **状態管理の不足**: ページ遷移を伴わないUI状態変化の記録ができていない
- **コンテキスト情報の欠如**: LLMに渡される情報が静的なHTML構造のみ
- **操作シーケンスの分断**: 一連の操作フローが個別のイベントとして扱われている
- **タイミング問題**: 非同期処理や遅延読み込みへの対応不足

## 解決アプローチ

### 1. UI状態管理システムの導入
詳細は [UI状態管理システム](ui-state-management-system.md) を参照

### 2. 操作フロー分析の強化
- **操作シーケンスの記録**: 関連する操作をグループ化
- **意図推定**: ユーザーの目標に基づいた操作分類
- **依存関係の特定**: 操作間の因果関係を記録

### 3. LLMプロンプトの改善
- **コンテキスト情報の拡充**: UI状態変遷を含む包括的な情報提供
- **操作フローの構造化**: 時系列データの効果的な表現
- **エラーハンドリング**: 失敗パターンの学習と対応

### 4. 新しい技術的アプローチ

#### A. リアルタイムDOM監視システム
```typescript
// MutationObserver + IntersectionObserver + ResizeObserverの統合
class AdvancedUITracker {
  private mutationObserver: MutationObserver;
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver;

  trackDynamicChanges(sessionId: string) {
    // DOM構造変更の監視
    this.mutationObserver = new MutationObserver(this.handleMutations);

    // 要素の可視性変更の監視
    this.intersectionObserver = new IntersectionObserver(this.handleVisibilityChange);

    // 要素サイズ変更の監視
    this.resizeObserver = new ResizeObserver(this.handleResize);
  }
}
```

#### B. セマンティック操作分析
```typescript
// ユーザー操作の意図を推定するシステム
class OperationSemanticAnalyzer {
  analyzeUserIntent(operations: UIOperation[]): UserIntent {
    // 操作パターンから意図を推定
    // 例: フォーム入力 → 送信 = "データ登録"
    // 例: 検索 → フィルタ → 選択 = "アイテム検索"
  }

  groupRelatedOperations(operations: UIOperation[]): OperationGroup[] {
    // 時間的・空間的近接性による操作グループ化
    // DOM要素の関連性による操作グループ化
  }
}
```

#### C. 動的要素対応コード生成
```typescript
// 動的要素を考慮したPlaywrightコード生成
class DynamicAwareCodeGenerator {
  generateWaitStrategies(uiStates: UIState[]): WaitStrategy[] {
    // UI状態変遷から適切な待機戦略を生成
    // 例: モーダル表示 → waitForSelector
    // 例: AJAX読み込み → waitForResponse
    // 例: アニメーション → waitForFunction
  }

  generateRobustSelectors(elements: DynamicElement[]): SelectorStrategy {
    // 動的に変化する要素に対する堅牢なセレクタ生成
    // 複数のセレクタ候補を生成（フォールバック戦略）
  }
}
```

## 期待される効果

### テストコード品質の向上
- **実用性**: 実際のユーザー操作を正確に再現
- **堅牢性**: 動的コンテンツや非同期処理に対応
- **保守性**: 理解しやすく修正しやすいコード生成

### 開発効率の向上
- **手動修正の削減**: 生成されたコードの修正作業を最小化
- **テストカバレッジ**: より包括的なテストシナリオの自動生成
- **品質保証**: 人的ミスの削減と一貫性の確保

## 既存コードベース考慮の実装計画

### フェーズ1: 既存機能の拡張（1-2週間）
- [ ] **BrowserPage.tsxの拡張**: 既存のMutationObserver（269-285行目）を`AdvancedUIStateTracker`に置き換え
- [ ] **データベーススキーマ拡張**: `OperationSession`と`UIStateTransition`モデルの追加
- [ ] **既存UIState活用**: 現在の`createUiState`（214-221行目）を拡張して詳細情報を記録
- [ ] **操作記録の改善**: 既存の`recordUserAction`（340-355行目）を`OperationSemanticAnalyzer`と統合

### フェーズ2: 分析機能の統合（2-3週間）
- [ ] **セマンティック分析**: 既存の`userActions`状態（63行目）を`OperationSemanticAnalyzer`で分析
- [ ] **セッション管理**: 既存のプロジェクトコンテキストを活用したセッション管理
- [ ] **状態差分検出**: 現在の`[MUTATION]`イベント（208-223行目）を詳細な状態変遷記録に拡張
- [ ] **ラベル情報統合**: 既存の`labels`状態（53行目）と新しい動的要素情報の統合

### フェーズ3: コード生成の改善（2-3週間）
- [ ] **プロンプト拡張**: 既存の`generatePlaywrightCode`関数を`EnhancedPromptContext`対応に更新
- [ ] **MCP統合強化**: 現在のMCP統合（56-62行目）に新しいコンテキスト情報を追加
- [ ] **待機戦略**: `DynamicWaitStrategyGenerator`を既存のコード生成パイプラインに統合
- [ ] **セレクタ戦略**: 既存の`generateSelector`（300-337行目）を`RobustSelectorGenerator`に置き換え

### フェーズ4: UI/UX改善（1-2週間）
- [ ] **リアルタイム分析表示**: 操作意図とセッション情報をUIに表示
- [ ] **ラベル登録改善**: 既存の`LabelPopup`（774-828行目）にトリガーアクション情報を統合
- [ ] **状態可視化**: UI状態遷移をリアルタイムで可視化
- [ ] **エラーフィードバック**: 改善されたエラーハンドリングのUI表示

### フェーズ5: 検証・最適化（1-2週間）
- [ ] **既存機能との互換性確認**: ラベル自動生成（542-637行目）との統合テスト
- [ ] **パフォーマンス最適化**: 大量のDOM変更イベント処理の最適化
- [ ] **メモリ使用量最適化**: 状態履歴の適切な制限とクリーンアップ
- [ ] **実環境テスト**: 実際のWebアプリケーションでの包括的テスト

## 既存コードとの統合ポイント

### 1. BrowserPage.tsxの主要統合箇所
- **Line 269-285**: MutationObserver → AdvancedUIStateTracker
- **Line 340-355**: recordUserAction → OperationSemanticAnalyzer
- **Line 63**: userActions状態 → 操作セッション管理
- **Line 214-221**: createUiState → 拡張UIState記録

### 2. API統合箇所
- **playwright-code-generator.ts**: 既存のMCP統合を拡張
- **scenarios.service.ts**: generateCode関数にコンテキスト情報追加
- **llm-utils.ts**: createReferenceTools に新しいデータ取得機能追加

### 3. データベース統合
- **既存UiStateモデル**: sessionId, domSnapshot等のフィールド追加
- **既存Labelモデル**: triggerActions, isDynamic等のフィールド追加
- **新規モデル**: OperationSession, UIStateTransition追加

## 成功指標

### 定量的指標
- **生成精度**: 手動修正が不要なテストコードの割合（目標: 80%以上）
- **カバレッジ**: 動的要素を含むテストケースの生成率（目標: 90%以上）
- **実行成功率**: 生成されたテストの初回実行成功率（目標: 85%以上）

### 定性的指標
- **ユーザビリティ**: 開発者からのフィードバック評価
- **保守性**: 生成されたコードの理解しやすさ
- **拡張性**: 新しいUIパターンへの対応能力

## リスクと対策

### 技術的リスク
- **複雑性の増大**: システムの複雑化による保守性の低下
  - 対策: モジュラー設計と十分なドキュメント化
- **パフォーマンス**: 状態追跡によるオーバーヘッド
  - 対策: 効率的なアルゴリズムと最適化

### プロジェクトリスク
- **開発期間**: 予想以上の開発時間
  - 対策: 段階的リリースとMVP（最小実行可能製品）アプローチ
- **品質**: 新機能による既存機能への影響
  - 対策: 包括的なテストと段階的ロールアウト

## 推奨ツール・パッケージ

### 1. DOM監視・状態追跡
- **MutationObserver API**: DOM変更の詳細な追跡
- **ResizeObserver API**: 要素サイズ変更の監視
- **IntersectionObserver API**: 要素の可視性変化の追跡
- **PerformanceObserver API**: パフォーマンス指標の監視

### 2. AI・LLM統合強化
- **@langchain/mcp-adapters**: 既存のMCP統合をさらに活用
- **@microsoft/playwright-mcp**: 最新版の活用（現在使用中）
- **@langchain/community**: 追加のツールとインテグレーション
- **zod**: スキーマ検証とタイプセーフティ（現在使用中）

### 3. テストコード品質向上
- **@playwright/test**: 最新のPlaywright機能活用
- **playwright-core**: コア機能の詳細制御
- **@axe-core/playwright**: アクセシビリティテストの統合
- **playwright-lighthouse**: パフォーマンステストの統合

### 4. データ分析・可視化
- **d3.js**: UI状態遷移の可視化
- **cytoscape.js**: グラフベースのUI状態関係図
- **mermaid**: フローチャート生成（既存のrender-mermaidツールと連携）

### 5. セッション・状態管理
- **uuid**: セッションID生成（既存で使用中）
- **lodash**: データ操作・分析の効率化
- **rxjs**: リアクティブなイベントストリーム処理
- **immer**: 不変データ構造による状態管理

### 6. 新しいアプローチ
- **Selenium WebDriver BiDi Protocol**: DOM mutation eventsの観測
- **Playwright Trace Viewer**: 実行トレースの詳細分析
- **Playwright Inspector**: デバッグとステップ実行
- **GitHub Copilot**: コード生成の補助（開発時）

## 実装優先度の提案

### 高優先度（即座に実装可能）
1. **MutationObserver統合**: ブラウザ操作画面でのDOM変更追跡
2. **操作セッション管理**: 関連操作のグループ化
3. **拡張プロンプト設計**: UI状態変遷情報を含むコンテキスト

### 中優先度（2-4週間で実装）
1. **状態差分検出**: before/after状態の詳細比較
2. **操作意図推定**: ユーザー行動パターンの分析
3. **動的要素待機**: 生成コードでの適切な待機処理

### 低優先度（長期的改善）
1. **可視化ダッシュボード**: UI状態遷移の可視化
2. **パフォーマンス最適化**: 大量データ処理の効率化
3. **機械学習統合**: パターン認識の自動化

## 具体的な実装例

### 1. 拡張されたUIState追跡
```typescript
// 現在のUIStateモデルを拡張
interface EnhancedUIState extends UIState {
  sessionId: string;
  timestamp: number;
  triggerAction: {
    type: 'click' | 'input' | 'hover' | 'keypress' | 'scroll' | 'focus' | 'blur';
    element: string;
    value?: string;
    coordinates?: { x: number; y: number };
  };
  beforeState: DOMSnapshot;
  afterState: DOMSnapshot;
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    loadTime: number;
    networkRequests?: string[];
  };
}

interface DOMSnapshot {
  visibleElements: string[];
  hiddenElements: string[];
  formValues: Record<string, string>;
  scrollPosition: { x: number; y: number };
  activeElement: string;
  newElements?: string[];
  removedElements?: string[];
  modifiedElements?: Array<{
    selector: string;
    changes: Record<string, any>;
  }>;
}
```

### 2. 改良されたプロンプト設計
```typescript
const ENHANCED_PROMPT_TEMPLATE = `
あなたはPlaywrightテストコード生成の専門家です。
以下の詳細な情報を基に、堅牢で実用的なテストコードを生成してください。

## シナリオ情報
タイトル: {title}
説明: {description}
Given: {given}
When: {when}
Then: {then}

## UI状態変遷履歴
{uiStateTransitions}

## 動的要素情報
{dynamicElements}

## 操作フロー分析
ユーザー意図: {userIntent}
操作グループ: {operationGroups}
依存関係: {dependencies}

## 生成要件
1. 動的要素の適切な待機処理を含める
2. 堅牢なセレクタ戦略を使用する
3. エラーハンドリングを含める
4. 実際のユーザー操作フローを反映する
5. 非同期処理とタイミングを考慮する

生成されたコードは以下の構造に従ってください：
- 適切なimport文
- 詳細なコメント
- 段階的な操作手順
- 各ステップでの検証
- エラー時のフォールバック処理
`;
```

### 3. 動的要素対応の待機戦略
```typescript
class WaitStrategyGenerator {
  generateWaitCode(transition: UIStateTransition): string {
    const { beforeState, afterState, triggerAction } = transition;

    // 新しく表示された要素がある場合
    if (afterState.newElements.length > 0) {
      return afterState.newElements.map(selector =>
        `await page.waitForSelector('${selector}', { state: 'visible' });`
      ).join('\n');
    }

    // フォーム送信の場合
    if (triggerAction.type === 'click' && triggerAction.element.includes('submit')) {
      return `await page.waitForLoadState('networkidle');`;
    }

    // モーダル表示の場合
    if (afterState.newElements.some(el => el.includes('modal'))) {
      return `await page.waitForSelector('[role="dialog"]', { state: 'visible' });`;
    }

    return `await page.waitForTimeout(100); // 短い待機`;
  }
}
```

## 関連ドキュメント
- [UI状態管理システム](ui-state-management-system.md)
- [Playwrightコード配布システム](playwright-code-distribution-system.md)
- [仕様書](../SPECIFICATION.md)
- [README.md](../../README.md)
