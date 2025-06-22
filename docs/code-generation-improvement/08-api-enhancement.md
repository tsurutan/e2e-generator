# ScenariosService 拡張実装提案

## 既存コードの改善点

現在の`scenarios.service.ts`の`generateCode`メソッド（318-377行目）を拡張して、UI状態変遷とセッション情報を活用します。

## 1. 拡張されたgenerateCodeメソッド

```typescript
// apps/api/src/scenarios/scenarios.service.ts

/**
 * シナリオからPlaywrightコードを生成する（拡張版）
 * @param id シナリオID
 * @param projectUrl プロジェクトのURL（オプション）
 * @param sessionId 操作セッションID（オプション）
 * @returns 生成されたコード
 */
async generateCode(id: string, projectUrl?: string, sessionId?: string): Promise<CodeResponseDto> {
    try {
        this.logger.log(`シナリオID ${id} のPlaywrightコードを生成します`);

        // 既存のシナリオ取得ロジック（323-336行目と同じ）
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

        // プロジェクトのURLを取得（既存ロジック）
        let url = projectUrl;
        if (!url && projectId) {
            const project = await this.prisma.project.findUnique({
                where: {id: projectId},
            });
            if (project) {
                url = project.url;
            }
        }

        // 🆕 拡張データ取得
        const enhancedContext = await this.buildEnhancedContext(projectId, sessionId);

        // 🆕 拡張されたコード生成
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

/**
 * 🆕 拡張コンテキスト情報を構築
 */
private async buildEnhancedContext(projectId: string, sessionId?: string) {
    // 基本ラベル情報（既存）
    const labels = await this.prisma.label.findMany({
        where: {projectId},
    });

    // 🆕 UI状態変遷情報を取得
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

    // 🆕 操作セッション情報を取得
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

    // 🆕 動的要素の検出
    const dynamicElements = this.detectDynamicElements(uiStateTransitions);

    // 🆕 操作意図の分析
    const userIntent = this.analyzeUserIntent(uiStateTransitions);

    // 🆕 操作グループの生成
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

/**
 * 🆕 動的要素を検出
 */
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

/**
 * 🆕 ユーザー意図を分析
 */
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

private detectSearchPattern(selectors: string[], types: string[]): boolean {
    const hasSearchInput = selectors.some(s => 
        s.includes('search') || s.includes('query') || s.includes('q')
    );
    const hasSearchAction = types.includes('submit') || selectors.some(s => 
        s.includes('search') || s.includes('find')
    );
    
    return hasSearchInput && hasSearchAction;
}

private detectFormPattern(selectors: string[], types: string[]): boolean {
    const inputCount = types.filter(t => t === 'input').length;
    const hasSubmit = types.includes('submit');
    
    return inputCount >= 2 && hasSubmit;
}

/**
 * 🆕 関連操作をグループ化
 */
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

private determineSuccess(operations: any[], intent: any): boolean {
    switch (intent.category) {
        case 'authentication':
            return operations.some(op => op.type === 'submit');
        case 'data_entry':
            return operations.some(op => op.type === 'submit');
        default:
            return true;
    }
}

/**
 * 🆕 パフォーマンス指標を抽出
 */
private extractPerformanceMetrics(transitions: any[]) {
    if (transitions.length === 0) return {};
    
    const metrics = {};
    for (const transition of transitions) {
        if (transition.metadata?.performanceMetrics) {
            Object.assign(metrics, transition.metadata.performanceMetrics);
        }
    }
    
    return metrics;
}
```

## 2. 拡張されたコード生成関数

```typescript
/**
 * 🆕 拡張されたPlaywrightコード生成
 */
private async generateEnhancedPlaywrightCode(
    scenario: any,
    context: any,
    url: string,
    projectId: string
): Promise<string> {
    
    // 🆕 拡張プロンプトテンプレートを使用
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
    
    // 🆕 拡張されたプロンプトでLLMを実行
    const result = await llmWithTools.invoke(enhancedPrompt);
    
    // コード抽出（既存ロジックを活用）
    const content = result.content as string;
    const codeBlockRegex = /```(?:typescript|js|javascript)?(.*?)```/s;
    const match = content.match(codeBlockRegex);
    
    return match ? match[1].trim() : content;
}

/**
 * 🆕 拡張プロンプトを構築
 */
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
