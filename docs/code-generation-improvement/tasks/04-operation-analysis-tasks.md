# 操作分析システム実装タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](../../DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- テストケース名は日本語で記述

## Phase 1: OperationSemanticAnalyzer実装

### Task 4.1: 基本分析ロジック実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] `OperationSemanticAnalyzer`クラスの基本構造作成
- [ ] 必要なインターフェース定義
  - `UserIntent`
  - `OperationGroup`
  - `OperationPattern`
- [ ] 基本的な分析メソッド定義

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`
- `apps/app/src/renderer/types/operation-analysis.types.ts`

#### 実装詳細
```typescript
export interface UserIntent {
  goal: string;
  confidence: number;
  category: 'authentication' | 'navigation' | 'data_entry' | 'search' | 'purchase' | 'other';
}

export interface OperationGroup {
  id: string;
  operations: TriggerAction[];
  intent: UserIntent;
  startTime: string;
  endTime: string;
  success: boolean;
}

export class OperationSemanticAnalyzer {
  private operationBuffer: TriggerAction[] = [];
  private readonly OPERATION_TIMEOUT = 5000; // 5秒
  
  analyzeUserIntent(operations: TriggerAction[]): UserIntent
  groupRelatedOperations(operations: TriggerAction[]): OperationGroup[]
  detectOperationPatterns(operations: TriggerAction[]): OperationPattern[]
}
```

#### 検証方法
- [ ] TypeScriptコンパイルエラーがないことを確認
- [ ] 基本的なインスタンス化が可能であることを確認

---

### Task 4.2: ログインパターン検出実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] `detectLoginPattern()`メソッド実装
- [ ] メールアドレス入力の検出
- [ ] パスワード入力の検出
- [ ] ログインボタンクリックの検出
- [ ] 信頼度計算ロジック

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
private detectLoginPattern(selectors: string[], types: string[]): boolean {
  const hasEmailInput = selectors.some(s => 
    s.includes('email') || s.includes('username') || s.includes('login')
  );
  const hasPasswordInput = selectors.some(s => 
    s.includes('password') || s.includes('pass')
  );
  const hasSubmit = types.includes('submit') || selectors.some(s => 
    s.includes('login') || s.includes('signin') || s.includes('submit')
  );
  
  return hasEmailInput && hasPasswordInput && hasSubmit;
}

analyzeUserIntent(operations: TriggerAction[]): UserIntent {
  const selectors = operations.map(op => op.element.toLowerCase());
  const types = operations.map(op => op.type);
  
  // ログインパターンの検出
  if (this.detectLoginPattern(selectors, types)) {
    return {
      goal: 'ユーザーログイン',
      confidence: 0.9,
      category: 'authentication'
    };
  }
  
  // その他のパターン...
  
  return {
    goal: '一般的な操作',
    confidence: 0.5,
    category: 'other'
  };
}
```

#### 検証方法
- [ ] 典型的なログインフローが正しく検出されることを確認
- [ ] 信頼度が適切に計算されることを確認
- [ ] 偽陽性・偽陰性が最小限であることを確認

---

### Task 4.3: 検索パターン検出実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] `detectSearchPattern()`メソッド実装
- [ ] 検索入力フィールドの検出
- [ ] 検索ボタンクリックの検出
- [ ] 検索結果表示の検出
- [ ] 検索クエリの分析

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
private detectSearchPattern(selectors: string[], types: string[]): boolean {
  const hasSearchInput = selectors.some(s => 
    s.includes('search') || s.includes('query') || s.includes('q')
  );
  const hasSearchAction = types.includes('submit') || selectors.some(s => 
    s.includes('search') || s.includes('find')
  );
  
  return hasSearchInput && hasSearchAction;
}

private analyzeSearchIntent(operations: TriggerAction[]): UserIntent {
  const searchTerms = operations
    .filter(op => op.type === 'input' && op.value)
    .map(op => op.value);
  
  let confidence = 0.8;
  
  // 検索語の複雑さに基づいて信頼度を調整
  if (searchTerms.some(term => term.length > 10)) {
    confidence += 0.1;
  }
  
  return {
    goal: 'コンテンツ検索',
    confidence: Math.min(confidence, 1.0),
    category: 'search'
  };
}
```

#### 検証方法
- [ ] 様々な検索パターンが正しく検出されることを確認
- [ ] 検索語の分析が適切であることを確認

---

### Task 4.4: フォーム入力パターン検出実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] `detectFormPattern()`メソッド実装
- [ ] 複数入力フィールドの検出
- [ ] フォーム送信の検出
- [ ] 入力データの種類分析
- [ ] フォームの目的推定

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
private detectFormPattern(selectors: string[], types: string[]): boolean {
  const inputCount = types.filter(t => t === 'input').length;
  const hasSubmit = types.includes('submit');
  
  return inputCount >= 2 && hasSubmit;
}

private analyzeFormType(operations: TriggerAction[]): string {
  const selectors = operations.map(op => op.element.toLowerCase());
  
  // 連絡先フォーム
  if (selectors.some(s => s.includes('contact') || s.includes('message'))) {
    return 'お問い合わせフォーム';
  }
  
  // 登録フォーム
  if (selectors.some(s => s.includes('register') || s.includes('signup'))) {
    return 'ユーザー登録フォーム';
  }
  
  // 購入フォーム
  if (selectors.some(s => s.includes('payment') || s.includes('billing'))) {
    return '購入・決済フォーム';
  }
  
  return 'データ入力フォーム';
}
```

#### 検証方法
- [ ] 様々なフォームタイプが正しく分類されることを確認
- [ ] フォームの目的が適切に推定されることを確認

---

## Phase 2: 操作グループ化機能実装

### Task 4.5: 時間的近接性分析実装
**優先度**: 🔴 高
**期間**: 2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] 時間的近接性による操作グループ化
- [ ] タイムアウト設定の最適化
- [ ] 操作間隔の分析
- [ ] セッション境界の検出

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
groupRelatedOperations(operations: TriggerAction[]): OperationGroup[] {
  const groups: OperationGroup[] = [];
  let currentGroup: TriggerAction[] = [];
  let lastTimestamp = 0;
  
  for (const operation of operations) {
    const timestamp = new Date(operation.timestamp).getTime();
    
    // タイムアウトまたは新しいページ遷移で新しいグループを開始
    if (timestamp - lastTimestamp > this.OPERATION_TIMEOUT || currentGroup.length === 0) {
      if (currentGroup.length > 0) {
        groups.push(this.createOperationGroup(currentGroup));
      }
      currentGroup = [operation];
    } else {
      currentGroup.push(operation);
    }
    
    lastTimestamp = timestamp;
  }
  
  if (currentGroup.length > 0) {
    groups.push(this.createOperationGroup(currentGroup));
  }
  
  return groups;
}

private createOperationGroup(operations: TriggerAction[]): OperationGroup {
  const intent = this.analyzeUserIntent(operations);
  
  return {
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operations,
    intent,
    startTime: operations[0].timestamp,
    endTime: operations[operations.length - 1].timestamp,
    success: this.determineSuccess(operations, intent)
  };
}
```

#### 検証方法
- [ ] 操作が適切にグループ化されることを確認
- [ ] タイムアウト設定が適切であることを確認

---

### Task 4.6: 空間的近接性分析実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] 要素の位置情報を活用した分析
- [ ] 近接する要素の操作グループ化
- [ ] UI領域の分析
- [ ] 関連要素の検出

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
private analyzeSpatialProximity(operations: TriggerAction[]): OperationGroup[] {
  const spatialGroups: OperationGroup[] = [];
  
  for (const operation of operations) {
    if (operation.coordinates) {
      // 座標情報を活用した近接性分析
      const nearbyOperations = this.findNearbyOperations(operation, operations);
      
      if (nearbyOperations.length > 1) {
        const group = this.createSpatialGroup(nearbyOperations);
        spatialGroups.push(group);
      }
    }
  }
  
  return spatialGroups;
}

private findNearbyOperations(
  targetOperation: TriggerAction, 
  allOperations: TriggerAction[]
): TriggerAction[] {
  const PROXIMITY_THRESHOLD = 100; // ピクセル
  
  return allOperations.filter(op => {
    if (!op.coordinates || !targetOperation.coordinates) return false;
    
    const distance = Math.sqrt(
      Math.pow(op.coordinates.x - targetOperation.coordinates.x, 2) +
      Math.pow(op.coordinates.y - targetOperation.coordinates.y, 2)
    );
    
    return distance <= PROXIMITY_THRESHOLD;
  });
}
```

#### 検証方法
- [ ] 空間的に近い操作が正しくグループ化されることを確認
- [ ] 閾値設定が適切であることを確認

---

### Task 4.7: 操作間の因果関係検出実装
**優先度**: 🟡 中
**期間**: 2-3日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] 操作の依存関係分析
- [ ] トリガー・レスポンス関係の検出
- [ ] 条件分岐の検出
- [ ] 操作チェーンの分析

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
private detectCausalRelationships(operations: TriggerAction[]): CausalRelation[] {
  const relations: CausalRelation[] = [];
  
  for (let i = 0; i < operations.length - 1; i++) {
    const current = operations[i];
    const next = operations[i + 1];
    
    // クリック → 新しい要素の表示
    if (current.type === 'click' && this.isElementAppearance(next)) {
      relations.push({
        trigger: current,
        response: next,
        type: 'element_appearance',
        confidence: 0.8
      });
    }
    
    // 入力 → バリデーション
    if (current.type === 'input' && this.isValidationResponse(next)) {
      relations.push({
        trigger: current,
        response: next,
        type: 'validation',
        confidence: 0.7
      });
    }
  }
  
  return relations;
}

private isElementAppearance(operation: TriggerAction): boolean {
  // 新しい要素の表示を示すパターンを検出
  return operation.element.includes('modal') || 
         operation.element.includes('dropdown') ||
         operation.element.includes('popup');
}
```

#### 検証方法
- [ ] 因果関係が正確に検出されることを確認
- [ ] 信頼度計算が適切であることを確認

---

## Phase 3: 成功判定機能実装

### Task 4.8: 操作成功判定実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] `determineSuccess()`メソッド実装
- [ ] 意図別成功基準の定義
- [ ] エラー状態の検出
- [ ] 完了状態の検出

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
private determineSuccess(operations: TriggerAction[], intent: UserIntent): boolean {
  // 意図に基づいて成功を判定
  switch (intent.category) {
    case 'authentication':
      // ログイン後のページ遷移があるかチェック
      return this.hasSuccessfulLogin(operations);
    
    case 'data_entry':
      // フォーム送信があるかチェック
      return operations.some(op => op.type === 'submit');
    
    case 'search':
      // 検索結果の表示があるかチェック
      return this.hasSearchResults(operations);
    
    default:
      return true;
  }
}

private hasSuccessfulLogin(operations: TriggerAction[]): boolean {
  // ログイン成功の指標を検出
  const hasSubmit = operations.some(op => op.type === 'submit');
  const hasRedirect = operations.some(op => 
    op.element.includes('dashboard') || 
    op.element.includes('profile') ||
    op.element.includes('home')
  );
  
  return hasSubmit && hasRedirect;
}

private hasSearchResults(operations: TriggerAction[]): boolean {
  // 検索結果の表示を検出
  return operations.some(op => 
    op.element.includes('result') || 
    op.element.includes('search-result') ||
    op.element.includes('list-item')
  );
}
```

#### 検証方法
- [ ] 各カテゴリの成功判定が正確であることを確認
- [ ] 偽陽性・偽陰性が最小限であることを確認

---

## Phase 4: パフォーマンス最適化

### Task 4.9: 分析パフォーマンス最適化
**優先度**: 🟡 中
**期間**: 1-2日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [ ] 分析処理の最適化
- [ ] キャッシュ機能の実装
- [ ] 非同期処理の活用
- [ ] メモリ使用量の最適化

#### 実装ファイル
- `apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts`
- `apps/api/src/scenarios/utils/OperationSemanticAnalyzer.ts`

#### 実装詳細
```typescript
export class OperationSemanticAnalyzer {
  private analysisCache = new Map<string, UserIntent>();
  private patternCache = new Map<string, OperationPattern[]>();
  
  analyzeUserIntent(operations: TriggerAction[]): UserIntent {
    // キャッシュキーの生成
    const cacheKey = this.generateCacheKey(operations);
    
    // キャッシュから取得
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }
    
    // 分析実行
    const intent = this.performAnalysis(operations);
    
    // キャッシュに保存
    this.analysisCache.set(cacheKey, intent);
    
    return intent;
  }
  
  private generateCacheKey(operations: TriggerAction[]): string {
    return operations
      .map(op => `${op.type}:${op.element}`)
      .join('|');
  }
}
```

#### 検証方法
- [ ] 分析処理が高速化されていることを確認
- [ ] メモリ使用量が許容範囲内であることを確認
- [ ] キャッシュが正しく動作することを確認

---

## 完了基準

### Phase 1完了基準
- [ ] OperationSemanticAnalyzerクラスが実装されている
- [ ] 主要なパターン検出機能が動作している
- [ ] ユーザー意図分析が正確に動作している

### Phase 2完了基準
- [ ] 操作グループ化機能が実装されている
- [ ] 時間的・空間的近接性分析が動作している
- [ ] 因果関係検出機能が動作している

### Phase 3完了基準
- [ ] 操作成功判定機能が実装されている
- [ ] 各カテゴリの判定が正確である
- [ ] エラー検出機能が動作している

### Phase 4完了基準
- [ ] パフォーマンスが最適化されている
- [ ] キャッシュ機能が動作している
- [ ] メモリ使用量が適切である

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `05-code-generation-logic-tasks.md`
- `06-testing-and-validation-tasks.md`
