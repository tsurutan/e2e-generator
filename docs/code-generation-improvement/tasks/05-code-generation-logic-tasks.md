# コード生成ロジック改善タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- テストケース名は日本語で記述

## Phase 1: 動的要素対応の待機戦略実装

### Task 5.1: DynamicWaitStrategyGenerator実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `DynamicWaitStrategyGenerator`クラスの基本構造作成
- [ ] UI状態変遷に基づく待機戦略生成
- [ ] モーダル表示対応戦略
- [ ] AJAX読み込み対応戦略
- [ ] アニメーション対応戦略

#### 実装ファイル
- `apps/api/src/scenarios/utils/DynamicWaitStrategyGenerator.ts`

#### 実装詳細
```typescript
export class DynamicWaitStrategyGenerator {
  generateWaitCode(transitions: UIStateTransition[]): string[] {
    const waitStrategies: string[] = [];
    
    for (const transition of transitions) {
      const { triggerAction, afterState } = transition;
      
      // 新しく表示された要素がある場合
      if (afterState.newElements && afterState.newElements.length > 0) {
        for (const element of afterState.newElements) {
          if (this.isModal(element)) {
            waitStrategies.push(`await page.waitForSelector('${element}', { state: 'visible', timeout: 10000 });`);
          } else if (this.isLoadingIndicator(element)) {
            waitStrategies.push(`await page.waitForSelector('${element}', { state: 'hidden', timeout: 30000 });`);
          } else {
            waitStrategies.push(`await page.waitForSelector('${element}', { state: 'visible' });`);
          }
        }
      }
      
      // フォーム送信の場合
      if (triggerAction.type === 'submit') {
        waitStrategies.push(`await page.waitForLoadState('networkidle');`);
      }
      
      // AJAX リクエストが発生する可能性がある操作
      if (this.isAjaxTrigger(triggerAction)) {
        waitStrategies.push(`await page.waitForResponse(response => response.status() === 200);`);
      }
    }
    
    return waitStrategies;
  }
  
  private isModal(selector: string): boolean {
    return selector.includes('modal') || 
           selector.includes('dialog') || 
           selector.includes('popup') ||
           selector.includes('[role="dialog"]');
  }
  
  private isLoadingIndicator(selector: string): boolean {
    return selector.includes('loading') || 
           selector.includes('spinner') || 
           selector.includes('progress');
  }
  
  private isAjaxTrigger(action: TriggerAction): boolean {
    return action.type === 'click' && (
      action.element.includes('button') ||
      action.element.includes('submit') ||
      action.element.includes('search')
    );
  }
}
```

#### 検証方法
- [ ] 各種動的要素に対する適切な待機戦略が生成されることを確認
- [ ] 生成されたコードが実行可能であることを確認

---

### Task 5.2: モーダル対応戦略実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] モーダル表示の検出機能
- [ ] モーダル内要素の操作戦略
- [ ] モーダル閉じる処理の生成
- [ ] 背景要素の無効化確認

#### 実装ファイル
- `apps/api/src/scenarios/utils/DynamicWaitStrategyGenerator.ts`

#### 実装詳細
```typescript
generateModalStrategy(transition: UIStateTransition): string[] {
  const strategies: string[] = [];
  
  // モーダル表示の待機
  strategies.push(`
// モーダルの表示を待機
await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
await page.waitForFunction(() => {
  const modal = document.querySelector('[role="dialog"]');
  return modal && window.getComputedStyle(modal).opacity === '1';
});`);

  // モーダル内要素の操作
  if (transition.afterState.newElements) {
    for (const element of transition.afterState.newElements) {
      if (this.isModalElement(element)) {
        strategies.push(`
// モーダル内要素の操作準備
await page.waitForSelector('${element}', { state: 'visible' });
await page.waitForFunction(() => {
  const element = document.querySelector('${element}');
  return element && !element.disabled;
});`);
      }
    }
  }

  return strategies;
}

private isModalElement(selector: string): boolean {
  return selector.includes('[role="dialog"]') ||
         selector.includes('.modal') ||
         selector.includes('.popup');
}
```

#### 検証方法
- [ ] モーダル表示が正しく検出されることを確認
- [ ] モーダル内操作が正常に動作することを確認

---

### Task 5.3: AJAX読み込み対応戦略実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] AJAX リクエストの検出
- [ ] ネットワーク待機戦略の生成
- [ ] 読み込み状態の確認
- [ ] 動的コンテンツの表示待機

#### 実装ファイル
- `apps/api/src/scenarios/utils/DynamicWaitStrategyGenerator.ts`

#### 実装詳細
```typescript
generateAjaxStrategy(transition: UIStateTransition): string[] {
  const strategies: string[] = [];
  
  // ネットワークリクエストの待機
  strategies.push(`
// AJAX リクエストの完了を待機
await page.waitForResponse(response => {
  return response.url().includes('/api/') && response.status() === 200;
});`);

  // 読み込み状態の確認
  strategies.push(`
// 読み込み完了の確認
await page.waitForFunction(() => {
  const loadingElements = document.querySelectorAll('.loading, .spinner, [data-loading]');
  return Array.from(loadingElements).every(el => 
    window.getComputedStyle(el).display === 'none'
  );
});`);

  // 動的コンテンツの表示確認
  if (transition.afterState.newElements) {
    strategies.push(`
// 動的コンテンツの表示確認
await page.waitForSelector('${transition.afterState.newElements[0]}', { 
  state: 'visible',
  timeout: 15000 
});`);
  }

  return strategies;
}
```

#### 検証方法
- [ ] AJAX リクエストが正しく検出されることを確認
- [ ] 読み込み完了が適切に判定されることを確認

---

## Phase 2: 堅牢なセレクタ戦略実装

### Task 5.4: RobustSelectorGenerator実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `RobustSelectorGenerator`クラスの基本構造作成
- [ ] 複数セレクタ戦略の生成
- [ ] セレクタ優先度システム
- [ ] フォールバック機能の実装

#### 実装ファイル
- `apps/api/src/scenarios/utils/RobustSelectorGenerator.ts`

#### 実装詳細
```typescript
export class RobustSelectorGenerator {
  generateSelectorStrategies(label: LabelDto): string[] {
    const strategies: string[] = [];
    
    // 1. data-testid属性（最優先）
    if (this.hasTestId(label.selector)) {
      strategies.push(`page.getByTestId('${this.extractTestId(label.selector)}')`);
    }
    
    // 2. ID属性
    if (this.hasId(label.selector)) {
      strategies.push(`page.locator('#${this.extractId(label.selector)}')`);
    }
    
    // 3. テキストコンテンツ
    if (label.elementText) {
      strategies.push(`page.getByText('${label.elementText}')`);
      strategies.push(`page.getByRole('button', { name: '${label.elementText}' })`);
    }
    
    // 4. 元のセレクタ
    strategies.push(`page.locator('${label.selector}')`);
    
    // 5. より具体的なセレクタ
    if (this.canMakeMoreSpecific(label.selector)) {
      strategies.push(`page.locator('${this.makeMoreSpecific(label.selector)}')`);
    }
    
    return strategies;
  }
  
  generateFallbackCode(strategies: string[]): string {
    if (strategies.length === 1) {
      return `const element = ${strategies[0]};`;
    }
    
    return `
// 複数のセレクタ戦略を試行
let element;
const selectors = [
${strategies.map(s => `  () => ${s}`).join(',\n')}
];

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
  throw new Error('要素が見つかりませんでした。すべてのセレクタ戦略が失敗しました。');
}`;
  }
}
```

#### 検証方法
- [ ] 複数のセレクタ戦略が正しく生成されることを確認
- [ ] フォールバック機能が正常に動作することを確認

---

### Task 5.5: セレクタ優先度システム実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] セレクタの信頼性評価
- [ ] 優先度に基づく並び替え
- [ ] 動的セレクタの検出
- [ ] セレクタの安定性分析

#### 実装ファイル
- `apps/api/src/scenarios/utils/RobustSelectorGenerator.ts`

#### 実装詳細
```typescript
private calculateSelectorPriority(selector: string, label: LabelDto): number {
  let priority = 0;
  
  // data-testid属性（最高優先度）
  if (this.hasTestId(selector)) {
    priority += 100;
  }
  
  // ID属性（高優先度）
  if (this.hasId(selector)) {
    priority += 80;
  }
  
  // 一意なクラス名
  if (this.hasUniqueClass(selector)) {
    priority += 60;
  }
  
  // テキストコンテンツ
  if (label.elementText && label.elementText.length > 0) {
    priority += 40;
  }
  
  // 構造的セレクタ（低優先度）
  if (this.isStructuralSelector(selector)) {
    priority += 20;
  }
  
  // 動的クラス名（最低優先度）
  if (this.isDynamicClass(selector)) {
    priority -= 50;
  }
  
  return priority;
}

private sortStrategiesByPriority(strategies: SelectorStrategy[]): SelectorStrategy[] {
  return strategies.sort((a, b) => b.priority - a.priority);
}
```

#### 検証方法
- [ ] セレクタの優先度が適切に計算されることを確認
- [ ] 並び替えが正しく動作することを確認

---

## Phase 3: エラーハンドリング強化

### Task 5.6: ErrorHandlingGenerator実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `ErrorHandlingGenerator`クラスの基本構造作成
- [ ] 操作別エラーハンドリング戦略
- [ ] リトライ機能の実装
- [ ] タイムアウト処理の改善

#### 実装ファイル
- `apps/api/src/scenarios/utils/ErrorHandlingGenerator.ts`

#### 実装詳細
```typescript
export class ErrorHandlingGenerator {
  generateErrorHandlingCode(operation: TriggerAction): string {
    switch (operation.type) {
      case 'click':
        return `
try {
  await element.click({ timeout: 10000 });
} catch (error) {
  // 要素がクリック可能になるまで待機
  await element.waitFor({ state: 'attached' });
  await element.scrollIntoViewIfNeeded();
  await element.click({ force: true });
}`;
      
      case 'input':
        return `
try {
  await element.fill('${operation.value}');
} catch (error) {
  // 入力フィールドがアクティブになるまで待機
  await element.focus();
  await element.clear();
  await element.type('${operation.value}', { delay: 100 });
}`;
      
      case 'submit':
        return `
try {
  await element.click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });
} catch (error) {
  // フォーム送信の代替方法
  await element.press('Enter');
  await page.waitForLoadState('domcontentloaded');
}`;
      
      default:
        return `
try {
  // 基本操作
  await element.${operation.type}();
} catch (error) {
  console.error('操作が失敗しました:', error);
  throw error;
}`;
    }
  }
  
  generateRetryWrapper(code: string, maxRetries: number = 3): string {
    return `
let retryCount = 0;
const maxRetries = ${maxRetries};

while (retryCount < maxRetries) {
  try {
    ${code}
    break; // 成功した場合はループを抜ける
  } catch (error) {
    retryCount++;
    console.log(\`試行 \${retryCount}/\${maxRetries} が失敗しました: \${error.message}\`);
    
    if (retryCount >= maxRetries) {
      throw new Error(\`\${maxRetries}回の試行後も操作が失敗しました: \${error.message}\`);
    }
    
    // リトライ前に少し待機
    await page.waitForTimeout(1000 * retryCount);
  }
}`;
  }
}
```

#### 検証方法
- [ ] 各操作タイプのエラーハンドリングが適切であることを確認
- [ ] リトライ機能が正常に動作することを確認

---

### Task 5.7: タイムアウト処理改善実装
**優先度**: 🟡 中
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 動的タイムアウト設定
- [ ] 操作別タイムアウト最適化
- [ ] ネットワーク状況に応じた調整
- [ ] パフォーマンス指標の活用

#### 実装ファイル
- `apps/api/src/scenarios/utils/ErrorHandlingGenerator.ts`

#### 実装詳細
```typescript
private calculateOptimalTimeout(operation: TriggerAction, context: any): number {
  let baseTimeout = 5000; // 基本タイムアウト
  
  // 操作タイプに基づく調整
  switch (operation.type) {
    case 'submit':
      baseTimeout = 30000; // フォーム送信は長めに
      break;
    case 'click':
      if (this.isAjaxTrigger(operation)) {
        baseTimeout = 15000; // AJAX操作は中程度
      }
      break;
  }
  
  // パフォーマンス指標に基づく調整
  if (context.performanceMetrics) {
    const avgLoadTime = context.performanceMetrics.domContentLoaded || 1000;
    baseTimeout = Math.max(baseTimeout, avgLoadTime * 2);
  }
  
  // ネットワーク状況に基づく調整
  if (this.isSlowNetwork(context)) {
    baseTimeout *= 1.5;
  }
  
  return Math.min(baseTimeout, 60000); // 最大60秒
}

generateTimeoutCode(operation: TriggerAction, context: any): string {
  const timeout = this.calculateOptimalTimeout(operation, context);
  
  return `
// 動的タイムアウト設定（${timeout}ms）
await element.waitFor({ 
  state: 'visible', 
  timeout: ${timeout} 
});`;
}
```

#### 検証方法
- [ ] タイムアウト設定が適切であることを確認
- [ ] パフォーマンス指標が正しく活用されることを確認

---

## Phase 4: 拡張プロンプトテンプレート実装

### Task 5.8: 拡張プロンプトテンプレート実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 拡張プロンプトテンプレートの作成
- [ ] UI状態変遷情報の統合
- [ ] 操作フロー情報の統合
- [ ] 動的要素情報の統合
- [ ] 品質要件の明確化

#### 実装ファイル
- `apps/api/src/scenarios/utils/enhanced-playwright-code-generator.ts`

#### 実装詳細
```typescript
export const ENHANCED_PROMPT_TEMPLATE = `
あなたはPlaywrightテストコード生成の専門家です。
以下の詳細な情報を基に、堅牢で実用的なテストコードを生成してください。

## シナリオ情報
タイトル: {title}
説明: {description}
Given: {given}
When: {when}
Then: {then}

## ユーザー操作フロー分析
ユーザー意図: {userIntent.goal} (信頼度: {userIntent.confidence})
操作カテゴリ: {userIntent.category}

## 操作グループ詳細
{operationGroups.map(group => `
グループ${group.id}:
- 目標: ${group.intent.goal}
- 操作数: ${group.operations.length}
- 成功: ${group.success ? 'はい' : 'いいえ'}
- 操作詳細:
${group.operations.map(op => `  - ${op.type}: ${op.element} ${op.value ? `(値: ${op.value})` : ''}`).join('\n')}
`).join('\n')}

## UI状態変遷履歴
{uiStateTransitions.map(transition => `
変遷${transition.timestamp}:
- トリガー: ${transition.triggerAction.type} on ${transition.triggerAction.element}
- 新規表示要素: ${transition.afterState.newElements?.join(', ') || 'なし'}
- 削除要素: ${transition.afterState.removedElements?.join(', ') || 'なし'}
- フォーム変更: ${JSON.stringify(transition.afterState.modifiedElements || [])}
`).join('\n')}

## 動的要素情報
動的に表示される要素: {dynamicElements.join(', ')}

## ラベル情報
{labels.map(label => `
- ${label.name}: ${label.selector}
  説明: ${label.description || 'なし'}
  動的: ${label.isDynamic ? 'はい' : 'いいえ'}
  トリガーアクション: ${label.triggerActions ? 'あり' : 'なし'}
`).join('\n')}

## パフォーマンス情報
- DOM読み込み完了: {performanceMetrics.domContentLoaded}ms
- 初回描画: {performanceMetrics.firstPaint}ms
- 最大コンテンツ描画: {performanceMetrics.largestContentfulPaint}ms

## 生成要件
1. **動的要素対応**: 新規表示要素には適切な待機処理を含める
2. **堅牢なセレクタ**: 複数のセレクタ候補を用意し、フォールバック戦略を実装
3. **操作フロー再現**: 実際のユーザー操作順序を正確に再現
4. **エラーハンドリング**: 要素が見つからない場合の対応を含める
5. **パフォーマンス考慮**: 適切な待機時間とタイムアウト設定
6. **検証の充実**: 各ステップでの状態検証を含める

## 待機戦略ガイドライン
- モーダル表示: waitForSelector('[role="dialog"]', { state: 'visible' })
- AJAX読み込み: waitForResponse(response => response.url().includes('/api/'))
- フォーム送信: waitForLoadState('networkidle')
- アニメーション: waitForFunction(() => !document.querySelector('.loading'))
- 動的コンテンツ: waitForSelector('.dynamic-content', { timeout: 10000 })

## セレクタ戦略
各要素に対して以下の優先順位でセレクタを生成：
1. data-testid属性
2. ID属性
3. 一意なクラス名
4. テキストコンテンツ
5. 構造的セレクタ（親子関係）

生成されたコードは以下の構造に従ってください：
- 詳細なコメントとJSDoc
- 段階的な操作手順
- 各ステップでの検証
- エラー時のフォールバック処理
- 実行可能な完全なテストコード
`;
```

#### 検証方法
- [ ] プロンプトテンプレートが正しく構築されることを確認
- [ ] 全ての情報が適切に統合されることを確認

---

## Phase 5: コード品質向上

### Task 5.9: コード構造最適化実装
**優先度**: 🟡 中
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 生成コードの構造最適化
- [ ] コメントの充実化
- [ ] 可読性の向上
- [ ] 保守性の向上

#### 実装ファイル
- `apps/api/src/scenarios/utils/enhanced-playwright-code-generator.ts`

#### 実装詳細
```typescript
export class CodeStructureOptimizer {
  optimizeGeneratedCode(code: string, context: any): string {
    let optimizedCode = code;
    
    // JSDocコメントの追加
    optimizedCode = this.addJSDocComments(optimizedCode, context);
    
    // ステップコメントの追加
    optimizedCode = this.addStepComments(optimizedCode, context);
    
    // エラーハンドリングの改善
    optimizedCode = this.improveErrorHandling(optimizedCode);
    
    // 可読性の向上
    optimizedCode = this.improveReadability(optimizedCode);
    
    return optimizedCode;
  }
  
  private addJSDocComments(code: string, context: any): string {
    const jsdoc = `
/**
 * ${context.scenario.title}
 * 
 * @description ${context.scenario.description || 'テストシナリオの実行'}
 * @author TestPilot (自動生成)
 * @generated ${new Date().toISOString()}
 * @userIntent ${context.userIntent.goal} (信頼度: ${context.userIntent.confidence})
 * @dynamicElements ${context.dynamicElements.length}個の動的要素を含む
 */`;
    
    return jsdoc + '\n' + code;
  }
}
```

#### 検証方法
- [ ] 生成されたコードの構造が改善されていることを確認
- [ ] コメントが適切に追加されていることを確認

---

## 完了基準

### Phase 1完了基準
- [ ] DynamicWaitStrategyGeneratorが実装されている
- [ ] 各種動的要素に対する待機戦略が生成される
- [ ] 生成されたコードが実行可能である

### Phase 2完了基準
- [ ] RobustSelectorGeneratorが実装されている
- [ ] 複数セレクタ戦略が正しく生成される
- [ ] フォールバック機能が動作している

### Phase 3完了基準
- [ ] ErrorHandlingGeneratorが実装されている
- [ ] 適切なエラーハンドリングが生成される
- [ ] リトライ機能が動作している

### Phase 4-5完了基準
- [ ] 拡張プロンプトテンプレートが実装されている
- [ ] コード品質が向上している
- [ ] 全体的な生成精度が改善されている

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `06-testing-and-validation-tasks.md`
- `07-performance-optimization-tasks.md`
