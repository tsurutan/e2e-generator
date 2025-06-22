# ScenariosController 拡張実装提案

## 既存エンドポイントの拡張

現在の`scenarios.controller.ts`に新しいエンドポイントを追加して、UI状態変遷を活用したコード生成を実現します。

## 1. 拡張されたDTO定義

```typescript
// apps/api/src/scenarios/dto/enhanced-generate-code.dto.ts
export class EnhancedGenerateCodeDto {
  /**
   * シナリオのID
   */
  scenarioId: string;

  /**
   * プロジェクトのURL（オプション）
   * @example "https://example.com"
   */
  projectUrl?: string;

  /**
   * 操作セッションID（オプション）
   * UI状態変遷情報を活用する場合に指定
   */
  sessionId?: string;

  /**
   * 特定のUI状態変遷IDのリスト（オプション）
   * 特定の操作フローのみを考慮する場合に指定
   */
  transitionIds?: string[];

  /**
   * コード生成オプション
   */
  options?: {
    /**
     * 動的要素の待機戦略を含めるかどうか
     */
    includeDynamicWaits?: boolean;

    /**
     * 堅牢なセレクタ戦略を使用するかどうか
     */
    useRobustSelectors?: boolean;

    /**
     * エラーハンドリングを含めるかどうか
     */
    includeErrorHandling?: boolean;

    /**
     * パフォーマンス考慮の待機処理を含めるかどうか
     */
    includePerformanceWaits?: boolean;
  };
}
```

```typescript
// apps/api/src/scenarios/dto/enhanced-code-response.dto.ts
export class EnhancedCodeResponseDto extends CodeResponseDto {
  /**
   * 使用されたUI状態変遷の数
   */
  transitionsUsed?: number;

  /**
   * 検出された動的要素の数
   */
  dynamicElementsDetected?: number;

  /**
   * 推定されたユーザー意図
   */
  userIntent?: {
    goal: string;
    confidence: number;
    category: string;
  };

  /**
   * 生成されたコードの品質指標
   */
  qualityMetrics?: {
    /**
     * 堅牢性スコア（0-1）
     */
    robustnessScore: number;

    /**
     * 動的要素対応度（0-1）
     */
    dynamicCoverage: number;

    /**
     * エラーハンドリング充実度（0-1）
     */
    errorHandlingCoverage: number;
  };

  /**
   * 生成に使用されたコンテキスト情報のサマリー
   */
  contextSummary?: {
    labelsUsed: number;
    transitionsAnalyzed: number;
    operationGroupsDetected: number;
    sessionDuration?: number; // ミリ秒
  };
}
```

## 2. 拡張されたコントローラー

```typescript
// apps/api/src/scenarios/scenarios.controller.ts に追加

/**
 * 🆕 UI状態変遷を活用した高度なPlaywrightコード生成エンドポイント
 * @param enhancedGenerateCodeDto 拡張コード生成データ
 * @returns 生成されたコードと詳細情報
 */
@Post('generate-enhanced-code')
async generateEnhancedCode(
  @Body() enhancedGenerateCodeDto: EnhancedGenerateCodeDto,
): Promise<EnhancedCodeResponseDto> {
  this.logger.log(`シナリオID ${enhancedGenerateCodeDto.scenarioId} の拡張Playwrightコードを生成するリクエストを受信しました`);
  return this.scenariosService.generateEnhancedCode(enhancedGenerateCodeDto);
}

/**
 * 🆕 操作セッションに基づくコード生成エンドポイント
 * @param sessionId 操作セッションID
 * @param scenarioId シナリオID
 * @returns 生成されたコード
 */
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

/**
 * 🆕 コード品質分析エンドポイント
 * @param id シナリオID
 * @param code 分析対象のコード
 * @returns コード品質指標
 */
@Post(':id/analyze-code-quality')
async analyzeCodeQuality(
  @Param('id') id: string,
  @Body() analyzeDto: { code: string; sessionId?: string },
): Promise<{
  qualityMetrics: {
    robustnessScore: number;
    dynamicCoverage: number;
    errorHandlingCoverage: number;
  };
  suggestions: string[];
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    line?: number;
  }>;
}> {
  this.logger.log(`シナリオID ${id} のコード品質を分析するリクエストを受信しました`);
  return this.scenariosService.analyzeCodeQuality(id, analyzeDto.code, analyzeDto.sessionId);
}

/**
 * 🆕 操作セッション情報取得エンドポイント
 * @param sessionId 操作セッションID
 * @returns セッション詳細情報
 */
@Get('session/:sessionId/details')
async getSessionDetails(
  @Param('sessionId') sessionId: string,
): Promise<{
  session: any;
  transitions: any[];
  userIntent: any;
  operationGroups: any[];
  dynamicElements: string[];
}> {
  this.logger.log(`セッションID ${sessionId} の詳細情報を取得するリクエストを受信しました`);
  return this.scenariosService.getSessionDetails(sessionId);
}

/**
 * 🆕 プロジェクトの操作セッション一覧取得エンドポイント
 * @param projectId プロジェクトID
 * @returns セッション一覧
 */
@Get('project/:projectId/sessions')
async getProjectSessions(
  @Param('projectId') projectId: string,
  @Query('status') status?: string,
  @Query('limit') limit?: string,
): Promise<{
  sessions: Array<{
    id: string;
    startTime: string;
    endTime?: string;
    userGoal?: string;
    status: string;
    transitionCount: number;
    userIntent?: any;
  }>;
  total: number;
}> {
  this.logger.log(`プロジェクトID ${projectId} の操作セッション一覧を取得するリクエストを受信しました`);
  return this.scenariosService.getProjectSessions(
    projectId, 
    status, 
    limit ? parseInt(limit) : 50
  );
}

/**
 * 🆕 既存のgenerateCodeエンドポイントを拡張
 * sessionIdパラメータを追加
 */
@Get(':id/generate-code')
async generateCode(
  @Param('id') id: string,
  @Query('projectUrl') projectUrl?: string,
  @Query('sessionId') sessionId?: string, // 🆕 追加
): Promise<CodeResponseDto> {
  this.logger.log(`シナリオID ${id} のPlaywrightコードを生成するリクエストを受信しました`);
  
  // sessionIdが指定されている場合は拡張版を使用
  if (sessionId) {
    const enhancedResult = await this.scenariosService.generateEnhancedCode({
      scenarioId: id,
      projectUrl,
      sessionId,
      options: {
        includeDynamicWaits: true,
        useRobustSelectors: true,
        includeErrorHandling: true,
      }
    });
    
    // 既存のCodeResponseDto形式に変換
    return {
      code: enhancedResult.code,
      scenarioId: enhancedResult.scenarioId,
      generationAttempt: enhancedResult.generationAttempt,
      previousError: enhancedResult.previousError,
    };
  }
  
  // 既存のロジックを使用
  return this.scenariosService.generateCode(id, projectUrl);
}
```

## 3. 新しいサービスメソッド

```typescript
// apps/api/src/scenarios/scenarios.service.ts に追加

/**
 * 🆕 拡張されたコード生成メソッド
 */
async generateEnhancedCode(dto: EnhancedGenerateCodeDto): Promise<EnhancedCodeResponseDto> {
  try {
    this.logger.log(`拡張コード生成を開始: シナリオID ${dto.scenarioId}`);

    // 基本的なコード生成（既存ロジックを活用）
    const basicResult = await this.generateCode(dto.scenarioId, dto.projectUrl, dto.sessionId);

    // 🆕 追加の分析情報を取得
    const enhancedInfo = await this.buildEnhancedAnalysis(dto);

    return {
      ...basicResult,
      transitionsUsed: enhancedInfo.transitionsUsed,
      dynamicElementsDetected: enhancedInfo.dynamicElementsDetected,
      userIntent: enhancedInfo.userIntent,
      qualityMetrics: enhancedInfo.qualityMetrics,
      contextSummary: enhancedInfo.contextSummary,
    };
  } catch (error) {
    this.logger.error('拡張コード生成中にエラーが発生しました', error.stack);
    throw error;
  }
}

/**
 * 🆕 コード品質分析メソッド
 */
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

/**
 * 🆕 セッション詳細情報取得メソッド
 */
async getSessionDetails(sessionId: string) {
  const session = await this.prisma.operationSession.findUnique({
    where: { id: sessionId },
    include: {
      uiStateTransitions: {
        orderBy: { timestamp: 'asc' }
      }
    }
  });

  if (!session) {
    throw new NotFoundException(`セッションID ${sessionId} が見つかりません`);
  }

  const context = await this.buildEnhancedContext(session.projectId, sessionId);

  return {
    session,
    transitions: context.uiStateTransitions,
    userIntent: context.userIntent,
    operationGroups: context.operationGroups,
    dynamicElements: context.dynamicElements,
  };
}

/**
 * 🆕 プロジェクトセッション一覧取得メソッド
 */
async getProjectSessions(projectId: string, status?: string, limit: number = 50) {
  const where: any = { projectId };
  if (status) {
    where.status = status;
  }

  const sessions = await this.prisma.operationSession.findMany({
    where,
    include: {
      _count: {
        select: { uiStateTransitions: true }
      }
    },
    orderBy: { startTime: 'desc' },
    take: limit,
  });

  const total = await this.prisma.operationSession.count({ where });

  return {
    sessions: sessions.map(session => ({
      id: session.id,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      userGoal: session.userGoal,
      status: session.status,
      transitionCount: session._count.uiStateTransitions,
    })),
    total,
  };
}
```
