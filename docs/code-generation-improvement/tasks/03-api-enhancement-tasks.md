# API拡張実装タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- テストケース名は日本語で記述

## Phase 1: ScenariosService拡張

### Task 3.1: 拡張コンテキスト構築機能実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `buildEnhancedContext()`メソッド実装
- [ ] UI状態変遷情報の取得
- [ ] 操作セッション情報の取得
- [ ] 動的要素の検出機能
- [ ] ユーザー意図の分析機能
- [ ] パフォーマンス指標の抽出

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
private async buildEnhancedContext(projectId: string, sessionId?: string) {
  // 基本ラベル情報（既存）
  const labels = await this.prisma.label.findMany({
    where: {projectId},
  });

  // UI状態変遷情報を取得
  const uiStateTransitions = sessionId 
    ? await this.prisma.uiStateTransition.findMany({
        where: { sessionId },
        include: {
          fromUIState: true,
          toUIState: true,
        },
        orderBy: { timestamp: 'asc' }
      })
    : [];

  // 操作セッション情報を取得
  const operationSession = sessionId
    ? await this.prisma.operationSession.findUnique({
        where: { id: sessionId },
        include: {
          uiStateTransitions: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })
    : null;

  // 動的要素の検出
  const dynamicElements = this.detectDynamicElements(uiStateTransitions);

  // 操作意図の分析
  const userIntent = this.analyzeUserIntent(uiStateTransitions);

  // 操作グループの生成
  const operationGroups = this.groupRelatedOperations(uiStateTransitions);

  return {
    labels: labels.map(label => label as unknown as LabelDto),
    uiStateTransitions,
    operationSession,
    dynamicElements,
    userIntent,
    operationGroups,
    performanceMetrics: this.extractPerformanceMetrics(uiStateTransitions)
  };
}
```

#### 検証方法
- [ ] 各種データが正しく取得できることを確認
- [ ] パフォーマンスが許容範囲内であることを確認
- [ ] エラーハンドリングが適切であることを確認

---

### Task 3.2: 動的要素検出機能実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `detectDynamicElements()`メソッド実装
- [ ] 新規表示要素の検出
- [ ] 削除要素の検出
- [ ] 動的要素のパターン分析

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
private detectDynamicElements(transitions: any[]): string[] {
  const dynamicElements = new Set<string>();
  
  for (const transition of transitions) {
    // 新規表示された要素
    if (transition.afterState?.newElements) {
      transition.afterState.newElements.forEach(el => dynamicElements.add(el));
    }
    
    // 削除された要素
    if (transition.afterState?.removedElements) {
      transition.afterState.removedElements.forEach(el => dynamicElements.add(el));
    }
  }
  
  return Array.from(dynamicElements);
}
```

#### 検証方法
- [ ] 動的要素が正確に検出されることを確認
- [ ] パフォーマンスが許容範囲内であることを確認

---

### Task 3.3: ユーザー意図分析機能実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `analyzeUserIntent()`メソッド実装
- [ ] ログインパターン検出
- [ ] 検索パターン検出
- [ ] フォーム入力パターン検出
- [ ] 信頼度計算機能

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
private analyzeUserIntent(transitions: any[]) {
  if (transitions.length === 0) {
    return { goal: '一般的な操作', confidence: 0.5, category: 'other' };
  }

  const actions = transitions.map(t => t.triggerAction);
  const selectors = actions.map(a => a.element?.toLowerCase() || '');
  const types = actions.map(a => a.type);

  // ログインパターンの検出
  if (this.detectLoginPattern(selectors, types)) {
    return { goal: 'ユーザーログイン', confidence: 0.9, category: 'authentication' };
  }

  // 検索パターンの検出
  if (this.detectSearchPattern(selectors, types)) {
    return { goal: 'コンテンツ検索', confidence: 0.8, category: 'search' };
  }

  // フォーム入力パターンの検出
  if (this.detectFormPattern(selectors, types)) {
    return { goal: 'データ入力・送信', confidence: 0.7, category: 'data_entry' };
  }

  return { goal: '一般的な操作', confidence: 0.5, category: 'other' };
}

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
```

#### 検証方法
- [ ] 各パターンが正確に検出されることを確認
- [ ] 信頼度計算が適切であることを確認

---

### Task 3.4: 操作グループ化機能実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `groupRelatedOperations()`メソッド実装
- [ ] 時間的近接性による分析
- [ ] 操作間の関連性検出
- [ ] グループ化アルゴリズム

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
private groupRelatedOperations(transitions: any[]) {
  const groups = [];
  let currentGroup = [];
  let lastTimestamp = 0;
  const OPERATION_TIMEOUT = 5000; // 5秒

  for (const transition of transitions) {
    const timestamp = new Date(transition.timestamp).getTime();
    
    if (timestamp - lastTimestamp > OPERATION_TIMEOUT || currentGroup.length === 0) {
      if (currentGroup.length > 0) {
        groups.push(this.createOperationGroup(currentGroup));
      }
      currentGroup = [transition];
    } else {
      currentGroup.push(transition);
    }
    
    lastTimestamp = timestamp;
  }
  
  if (currentGroup.length > 0) {
    groups.push(this.createOperationGroup(currentGroup));
  }
  
  return groups;
}

private createOperationGroup(transitions: any[]) {
  const operations = transitions.map(t => t.triggerAction);
  const intent = this.analyzeUserIntent(transitions);
  
  return {
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operations,
    intent,
    startTime: transitions[0].timestamp,
    endTime: transitions[transitions.length - 1].timestamp,
    success: this.determineSuccess(operations, intent)
  };
}
```

#### 検証方法
- [ ] 操作が適切にグループ化されることを確認
- [ ] グループの意図が正確に推定されることを確認

---

## Phase 2: 拡張generateCodeメソッド実装

### Task 3.5: 拡張generateCodeメソッド実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 既存`generateCode`メソッドの拡張
- [ ] sessionIdパラメータの追加
- [ ] 拡張コンテキストの活用
- [ ] 既存機能との互換性保持

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
async generateCode(id: string, projectUrl?: string, sessionId?: string): Promise<CodeResponseDto> {
  try {
    this.logger.log(`シナリオID ${id} のPlaywrightコードを生成します`);

    // 既存のシナリオ取得ロジック
    const scenario = await this.prisma.scenario.findUnique({
      where: {id},
      include: {
        feature: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundException(`シナリオID ${id} が見つかりません`);
    }

    const projectId = scenario.feature?.project?.id;

    // プロジェクトのURLを取得
    let url = projectUrl;
    if (!url && projectId) {
      const project = await this.prisma.project.findUnique({
        where: {id: projectId},
      });
      if (project) {
        url = project.url;
      }
    }

    // 拡張データ取得
    const enhancedContext = await this.buildEnhancedContext(projectId, sessionId);

    // 拡張されたコード生成
    const code = await this.generateEnhancedPlaywrightCode(
      scenario, 
      enhancedContext, 
      url, 
      projectId
    );

    this.logger.log(`シナリオID ${id} のPlaywrightコードを生成しました`);

    return {
      code,
      scenarioId: id,
    };
  } catch (error) {
    this.logger.error('コード生成中にエラーが発生しました', error.stack);
    throw error;
  }
}
```

#### 検証方法
- [ ] 既存機能が正常に動作することを確認
- [ ] 新機能が正しく動作することを確認
- [ ] sessionIdが指定された場合の動作確認

---

### Task 3.6: 拡張プロンプト構築機能実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `generateEnhancedPlaywrightCode()`メソッド実装
- [ ] 拡張プロンプトテンプレートの作成
- [ ] UI状態変遷情報の統合
- [ ] 動的要素情報の統合

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
private async generateEnhancedPlaywrightCode(
  scenario: any,
  context: any,
  url: string,
  projectId: string
): Promise<string> {
  
  // 拡張プロンプトテンプレートを使用
  const enhancedPrompt = this.buildEnhancedPrompt(scenario, context, url);
  
  // 既存のMCP統合を活用
  const mcpClient = new MultiServerMCPClient({
    playwright: {
      command: 'npx',
      args: ['@playwright/mcp@latest', '--headless'],
    },
  });
  
  const tools = await mcpClient.getTools('playwright');
  const llmWithTools = this.llm.bind({
    tools: [...createReferenceTools(this.prisma, projectId), ...tools],
  });
  
  // 拡張されたプロンプトでLLMを実行
  const result = await llmWithTools.invoke(enhancedPrompt);
  
  // コード抽出
  const content = result.content as string;
  const codeBlockRegex = /```(?:typescript|js|javascript)?(.*?)```/s;
  const match = content.match(codeBlockRegex);
  
  return match ? match[1].trim() : content;
}

private buildEnhancedPrompt(scenario: any, context: any, url: string) {
  return `
あなたはPlaywrightテストコード生成の専門家です。
以下の詳細な情報を基に、堅牢で実用的なテストコードを生成してください。

## シナリオ情報
タイトル: ${scenario.title}
説明: ${scenario.description || '説明なし'}
Given: ${scenario.given}
When: ${scenario.when}
Then: ${scenario.then}

## ユーザー操作フロー分析
ユーザー意図: ${context.userIntent.goal} (信頼度: ${context.userIntent.confidence})
操作カテゴリ: ${context.userIntent.category}

## UI状態変遷履歴
${context.uiStateTransitions.map(transition => `
変遷 ${transition.timestamp}:
- トリガー: ${transition.triggerAction.type} on ${transition.triggerAction.element}
- 新規表示要素: ${transition.afterState.newElements?.join(', ') || 'なし'}
- 削除要素: ${transition.afterState.removedElements?.join(', ') || 'なし'}
`).join('\n')}

## 動的要素情報
動的に表示される要素: ${context.dynamicElements.join(', ')}

## ラベル情報
${context.labels.map(label => `
- ${label.name}: ${label.selector}
  説明: ${label.description || 'なし'}
`).join('\n')}

## 生成要件
1. **動的要素対応**: 新規表示要素には適切な待機処理を含める
2. **堅牢なセレクタ**: 複数のセレクタ候補を用意し、フォールバック戦略を実装
3. **操作フロー再現**: 実際のユーザー操作順序を正確に再現
4. **エラーハンドリング**: 要素が見つからない場合の対応を含める
5. **パフォーマンス考慮**: 適切な待機時間とタイムアウト設定

プロジェクトURL: ${url}

生成されたコードは実行可能な完全なPlaywrightテストコードである必要があります。
`;
}
```

#### 検証方法
- [ ] プロンプトが正しく構築されることを確認
- [ ] LLMからの応答が期待通りであることを確認
- [ ] 生成されたコードが実行可能であることを確認

---

## Phase 3: 新しいエンドポイント実装

### Task 3.7: 拡張コード生成エンドポイント実装
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `EnhancedGenerateCodeDto`の作成
- [ ] `EnhancedCodeResponseDto`の作成
- [ ] `/scenarios/generate-enhanced-code`エンドポイント実装
- [ ] バリデーション機能

#### 実装ファイル
- `apps/api/src/scenarios/dto/enhanced-generate-code.dto.ts`
- `apps/api/src/scenarios/dto/enhanced-code-response.dto.ts`
- `apps/api/src/scenarios/scenarios.controller.ts`

#### 実装詳細
```typescript
// enhanced-generate-code.dto.ts
export class EnhancedGenerateCodeDto {
  scenarioId: string;
  projectUrl?: string;
  sessionId?: string;
  transitionIds?: string[];
  options?: {
    includeDynamicWaits?: boolean;
    useRobustSelectors?: boolean;
    includeErrorHandling?: boolean;
    includePerformanceWaits?: boolean;
  };
}

// scenarios.controller.ts
@Post('generate-enhanced-code')
async generateEnhancedCode(
  @Body() enhancedGenerateCodeDto: EnhancedGenerateCodeDto,
): Promise<EnhancedCodeResponseDto> {
  this.logger.log(`シナリオID ${enhancedGenerateCodeDto.scenarioId} の拡張Playwrightコードを生成するリクエストを受信しました`);
  return this.scenariosService.generateEnhancedCode(enhancedGenerateCodeDto);
}
```

#### 検証方法
- [ ] エンドポイントが正常に動作することを確認
- [ ] バリデーションが適切に動作することを確認
- [ ] レスポンス形式が正しいことを確認

---

### Task 3.8: セッション関連エンドポイント実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `/scenarios/session/:sessionId/scenario/:scenarioId/generate-code`エンドポイント
- [ ] `/scenarios/session/:sessionId/details`エンドポイント
- [ ] `/scenarios/project/:projectId/sessions`エンドポイント

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.controller.ts`

#### 実装詳細
```typescript
@Get('session/:sessionId/scenario/:scenarioId/generate-code')
async generateCodeFromSession(
  @Param('sessionId') sessionId: string,
  @Param('scenarioId') scenarioId: string,
  @Query('projectUrl') projectUrl?: string,
): Promise<EnhancedCodeResponseDto> {
  this.logger.log(`セッションID ${sessionId} とシナリオID ${scenarioId} からPlaywrightコードを生成するリクエストを受信しました`);
  
  const enhancedDto: EnhancedGenerateCodeDto = {
    scenarioId,
    sessionId,
    projectUrl,
    options: {
      includeDynamicWaits: true,
      useRobustSelectors: true,
      includeErrorHandling: true,
      includePerformanceWaits: true,
    }
  };
  
  return this.scenariosService.generateEnhancedCode(enhancedDto);
}
```

#### 検証方法
- [ ] 各エンドポイントが正常に動作することを確認
- [ ] パラメータが正しく処理されることを確認

---

## Phase 4: コード品質分析機能

### Task 3.9: コード品質分析機能実装
**優先度**: 🟡 中
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] `analyzeCodeQuality()`メソッド実装
- [ ] 堅牢性スコア計算
- [ ] 動的要素対応度計算
- [ ] エラーハンドリング充実度計算
- [ ] 改善提案生成機能

#### 実装ファイル
- `apps/api/src/scenarios/scenarios.service.ts`

#### 実装詳細
```typescript
async analyzeCodeQuality(scenarioId: string, code: string, sessionId?: string) {
  // コード品質分析ロジック
  const robustnessScore = this.calculateRobustnessScore(code);
  const dynamicCoverage = this.calculateDynamicCoverage(code, sessionId);
  const errorHandlingCoverage = this.calculateErrorHandlingCoverage(code);

  const suggestions = this.generateImprovementSuggestions(code);
  const issues = this.detectCodeIssues(code);

  return {
    qualityMetrics: {
      robustnessScore,
      dynamicCoverage,
      errorHandlingCoverage,
    },
    suggestions,
    issues,
  };
}

private calculateRobustnessScore(code: string): number {
  let score = 0;
  
  // 複数セレクタ戦略の確認
  if (code.includes('getByTestId') || code.includes('getByRole')) score += 0.3;
  if (code.includes('waitForSelector')) score += 0.2;
  if (code.includes('try') && code.includes('catch')) score += 0.2;
  if (code.includes('waitForResponse') || code.includes('waitForLoadState')) score += 0.3;
  
  return Math.min(score, 1.0);
}
```

#### 検証方法
- [ ] 品質分析が正確であることを確認
- [ ] スコア計算が適切であることを確認
- [ ] 改善提案が有用であることを確認

---

## 完了基準

### Phase 1完了基準
- [ ] 拡張コンテキスト構築機能が実装されている
- [ ] 動的要素検出機能が動作している
- [ ] ユーザー意図分析機能が動作している

### Phase 2完了基準
- [ ] 拡張generateCodeメソッドが実装されている
- [ ] 拡張プロンプトが正しく構築されている
- [ ] 既存機能との互換性が保たれている

### Phase 3完了基準
- [ ] 新しいエンドポイントが実装されている
- [ ] セッション関連機能が動作している
- [ ] APIドキュメントが更新されている

### Phase 4完了基準
- [ ] コード品質分析機能が実装されている
- [ ] 品質指標が正確に計算されている
- [ ] 改善提案機能が動作している

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `04-operation-analysis-tasks.md`
- `05-code-generation-logic-tasks.md`
