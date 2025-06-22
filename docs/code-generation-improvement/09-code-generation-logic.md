# 拡張Playwrightコード生成システム

## 現在のコード生成の課題

現在の実装では以下の課題があります：

1. **静的HTML解析のみ**: 動的な状態変化が考慮されていない
2. **操作フローの分断**: 一連のユーザー操作が個別に扱われている
3. **待機戦略の不足**: 動的要素に対する適切な待機処理がない
4. **エラーハンドリングの不足**: 失敗時の対応策が限定的

## 改善されたコード生成システム

### 1. 拡張されたプロンプトテンプレート

```typescript
// apps/api/src/scenarios/utils/enhanced-playwright-code-generator.ts
export interface EnhancedPromptContext {
  scenario: ScenarioDto;
  labels: LabelDto[];
  uiStateTransitions: UIStateTransition[];
  operationGroups: OperationGroup[];
  userIntent: UserIntent;
  dynamicElements: string[];
  performanceMetrics: Record<string, number>;
  projectUrl: string;
}

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

### 2. 動的要素対応の待機戦略生成

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
      
      // フォーム値の変更がある場合
      if (afterState.modifiedElements && afterState.modifiedElements.length > 0) {
        for (const modified of afterState.modifiedElements) {
          if (modified.changes.value) {
            waitStrategies.push(`await expect(page.locator('${modified.selector}')).toHaveValue('${modified.changes.value.to}');`);
          }
        }
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

### 3. 堅牢なセレクタ生成戦略

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
  
  private hasTestId(selector: string): boolean {
    return selector.includes('[data-testid') || selector.includes('data-testid');
  }
  
  private extractTestId(selector: string): string {
    const match = selector.match(/data-testid[='"]*([^'"]*)['"]/);
    return match ? match[1] : '';
  }
  
  private hasId(selector: string): boolean {
    return selector.includes('#') && !selector.includes(' ');
  }
  
  private extractId(selector: string): string {
    return selector.replace('#', '');
  }
  
  private canMakeMoreSpecific(selector: string): boolean {
    return !selector.includes('>') && !selector.includes(':nth-child');
  }
  
  private makeMoreSpecific(selector: string): string {
    // より具体的なセレクタを生成するロジック
    return selector + ':visible';
  }
}
```

### 4. エラーハンドリングとリトライ戦略

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
    console.log(\`試行 \${retryCount}/\${maxRetries} が失敗しました:, error.message\`);
    
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
