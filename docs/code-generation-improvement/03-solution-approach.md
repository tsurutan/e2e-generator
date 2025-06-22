# 解決アプローチ

## 全体戦略

### 1. 段階的改善アプローチ
既存システムを壊すことなく、段階的に機能を拡張していきます。

### 2. データ駆動型改善
実際のユーザー操作データを活用して、より現実的なテストコードを生成します。

### 3. AI/LLM活用の最適化
既存のMCP統合とLangChainを活用しつつ、コンテキスト情報を大幅に拡充します。

## 主要な解決策

### 1. UI状態管理システムの導入

#### 現在の課題
- 静的HTML解析のみ
- 動的変化の未記録
- 操作フローの分断

#### 解決策: AdvancedUIStateTracker

```typescript
export class AdvancedUIStateTracker {
  private mutationObserver: MutationObserver;
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver;
  
  // リアルタイムでUI状態変遷を記録
  recordTransition(triggerAction: TriggerAction): void {
    const beforeState = this.captureSnapshot();
    
    setTimeout(() => {
      const afterState = this.captureSnapshot();
      const diff = this.calculateStateDiff(beforeState, afterState);
      
      // 詳細な状態変遷をAPIに送信
      this.sendTransitionToAPI({
        triggerAction,
        beforeState,
        afterState: { ...afterState, ...diff },
        metadata: this.captureMetadata()
      });
    }, 100);
  }
}
```

#### 期待される効果
- モーダル、ドロップダウン等の動的変化を完全記録
- 操作前後の状態差分を詳細に把握
- パフォーマンス情報も同時に記録

### 2. 操作フロー分析の強化

#### 現在の課題
- 個別操作の記録のみ
- 関連性の未考慮
- 意図推定の不足

#### 解決策: OperationSemanticAnalyzer

```typescript
export class OperationSemanticAnalyzer {
  analyzeUserIntent(operations: TriggerAction[]): UserIntent {
    // ログインパターンの検出
    if (this.detectLoginPattern(operations)) {
      return {
        goal: 'ユーザーログイン',
        confidence: 0.9,
        category: 'authentication'
      };
    }
    
    // 検索パターンの検出
    if (this.detectSearchPattern(operations)) {
      return {
        goal: 'コンテンツ検索',
        confidence: 0.8,
        category: 'search'
      };
    }
    
    return this.defaultIntent();
  }
  
  groupRelatedOperations(operations: TriggerAction[]): OperationGroup[] {
    // 時間的・空間的近接性による操作グループ化
    // 操作間の因果関係を特定
  }
}
```

#### 期待される効果
- ユーザーの意図を正確に理解
- 関連する操作をグループ化
- より文脈を理解したコード生成

### 3. LLMプロンプトの改善

#### 現在の課題
- 静的情報のみ
- コンテキスト不足
- 動的要素への対応不足

#### 解決策: 拡張プロンプトテンプレート

```typescript
const ENHANCED_PROMPT_TEMPLATE = `
あなたはPlaywrightテストコード生成の専門家です。
以下の詳細な情報を基に、堅牢で実用的なテストコードを生成してください。

## シナリオ情報
タイトル: {title}
Given: {given}
When: {when}
Then: {then}

## ユーザー操作フロー分析
ユーザー意図: {userIntent.goal} (信頼度: {userIntent.confidence})
操作カテゴリ: {userIntent.category}

## UI状態変遷履歴
{uiStateTransitions.map(transition => `
変遷 ${transition.timestamp}:
- トリガー: ${transition.triggerAction.type} on ${transition.triggerAction.element}
- 新規表示要素: ${transition.afterState.newElements?.join(', ') || 'なし'}
- 削除要素: ${transition.afterState.removedElements?.join(', ') || 'なし'}
`).join('\n')}

## 動的要素情報
動的に表示される要素: {dynamicElements.join(', ')}

## 生成要件
1. **動的要素対応**: 新規表示要素には適切な待機処理を含める
2. **堅牢なセレクタ**: 複数のセレクタ候補を用意し、フォールバック戦略を実装
3. **操作フロー再現**: 実際のユーザー操作順序を正確に再現
4. **エラーハンドリング**: 要素が見つからない場合の対応を含める
`;
```

#### 期待される効果
- 実際のユーザー操作フローを理解
- 動的要素に対する適切な待機戦略
- より現実的なテストシナリオの生成

### 4. 動的要素対応の待機戦略

#### 現在の課題
- 基本的な`waitForSelector`のみ
- タイムアウトエラーの頻発
- 動的コンテンツへの対応不足

#### 解決策: DynamicWaitStrategyGenerator

```typescript
export class DynamicWaitStrategyGenerator {
  generateWaitCode(transitions: UIStateTransition[]): string[] {
    const waitStrategies: string[] = [];
    
    for (const transition of transitions) {
      const { triggerAction, afterState } = transition;
      
      // モーダル表示の場合
      if (this.isModal(afterState.newElements)) {
        waitStrategies.push(
          `await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });`
        );
      }
      
      // AJAX読み込みの場合
      if (this.isAjaxTrigger(triggerAction)) {
        waitStrategies.push(
          `await page.waitForResponse(response => response.status() === 200);`
        );
      }
      
      // フォーム送信の場合
      if (triggerAction.type === 'submit') {
        waitStrategies.push(
          `await page.waitForLoadState('networkidle');`
        );
      }
    }
    
    return waitStrategies;
  }
}
```

#### 期待される効果
- 動的要素に対する適切な待機処理
- タイムアウトエラーの大幅削減
- より安定したテスト実行

### 5. 堅牢なセレクタ戦略

#### 現在の課題
- 単一セレクタのみ
- 脆弱なセレクタ生成
- フォールバック機能なし

#### 解決策: RobustSelectorGenerator

```typescript
export class RobustSelectorGenerator {
  generateSelectorStrategies(label: LabelDto): string[] {
    const strategies: string[] = [];
    
    // 1. data-testid属性（最優先）
    if (this.hasTestId(label.selector)) {
      strategies.push(`page.getByTestId('${this.extractTestId(label.selector)}')`);
    }
    
    // 2. テキストコンテンツ
    if (label.elementText) {
      strategies.push(`page.getByText('${label.elementText}')`);
      strategies.push(`page.getByRole('button', { name: '${label.elementText}' })`);
    }
    
    // 3. 元のセレクタ
    strategies.push(`page.locator('${label.selector}')`);
    
    return strategies;
  }
  
  generateFallbackCode(strategies: string[]): string {
    return `
// 複数のセレクタ戦略を試行
let element;
const selectors = [${strategies.map(s => `() => ${s}`).join(',\n  ')}];

for (const selectorFn of selectors) {
  try {
    element = selectorFn();
    await element.waitFor({ state: 'visible', timeout: 5000 });
    break;
  } catch (error) {
    console.log('セレクタが見つかりません、次の戦略を試行中...');
  }
}

if (!element) {
  throw new Error('要素が見つかりませんでした。');
}`;
  }
}
```

#### 期待される効果
- セレクタエラーの大幅削減
- より堅牢なテストコード
- 保守性の向上

## 実装戦略

### Phase 1: 基盤整備（1-2週間）
1. **データベーススキーマ拡張**
   - `OperationSession`モデル追加
   - `UIStateTransition`モデル追加
   - 既存モデルの拡張

2. **BrowserPage.tsx改善**
   - `AdvancedUIStateTracker`実装
   - 既存`MutationObserver`の置き換え
   - セッション管理機能追加

### Phase 2: 分析機能実装（2-3週間）
1. **操作分析システム**
   - `OperationSemanticAnalyzer`実装
   - 意図推定アルゴリズム
   - 操作グループ化機能

2. **API拡張**
   - 拡張コンテキスト構築
   - 新しいエンドポイント追加
   - 既存APIとの統合

### Phase 3: コード生成改善（2-3週間）
1. **プロンプト拡張**
   - 拡張プロンプトテンプレート
   - 動的要素対応ロジック
   - 待機戦略生成

2. **セレクタ戦略**
   - 堅牢なセレクタ生成
   - フォールバック機能
   - エラーハンドリング強化

### Phase 4: 検証・最適化（1-2週間）
1. **品質検証**
   - 実際のWebアプリでのテスト
   - 生成精度の測定
   - パフォーマンス最適化

2. **ユーザビリティ改善**
   - UI/UX改善
   - エラーメッセージ改善
   - ドキュメント整備

## 成功指標

### 定量的指標
- **生成精度**: 50% → 80%（手動修正不要率）
- **動的要素対応**: 0% → 90%（モーダル等の対応率）
- **実行成功率**: 60% → 85%（初回実行成功率）
- **タイムアウトエラー**: 50%削減

### 定性的指標
- **コード品質**: より理解しやすく保守しやすいコード
- **ユーザビリティ**: 開発者からの満足度向上
- **拡張性**: 新しいUIパターンへの対応力

## リスク軽減策

### 技術的リスク
- **段階的実装**: 既存機能を壊さない漸進的改善
- **十分なテスト**: 各段階での包括的テスト
- **ロールバック計画**: 問題発生時の迅速な復旧

### プロジェクトリスク
- **優先度管理**: 高影響・低リスクから実装
- **定期的レビュー**: 進捗と品質の継続的確認
- **ユーザーフィードバック**: 早期からのユーザー参加

この解決アプローチにより、TestPilotのPlaywrightコード生成機能は大幅に改善され、実用的で堅牢なテスト自動化が実現されます。
