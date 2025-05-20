import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import {
  ScenarioDto,
  ScenarioListDto,
  SaveScenarioDto,
  SaveScenariosDto,
  ExtractScenariosDto,
  CodeResponseDto,
  TestErrorDto,
} from './dto';
import { generatePlaywrightCode } from './utils/playwright-code-generator';
import { LabelDto } from '../labels/dto/label.dto';

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);
  private readonly llm: ChatOpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // OpenAI APIの設定
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'gpt-4o',
      temperature: 0.2,
    });
  }

  /**
   * 仕様書からシナリオを抽出する
   * @param extractScenariosDto 仕様書データ
   * @returns 抽出されたシナリオのリスト
   */
  async extractScenarios(
    extractScenariosDto: ExtractScenariosDto,
  ): Promise<ScenarioListDto> {
    try {
      this.logger.log('仕様書からシナリオを抽出します');

      // 機能IDが指定されている場合は、その機能が存在するか確認
      if (extractScenariosDto.featureId) {
        const feature = await this.prisma.feature.findUnique({
          where: { id: extractScenariosDto.featureId },
        });

        if (!feature) {
          throw new NotFoundException(
            `機能ID ${extractScenariosDto.featureId} が見つかりません`,
          );
        }
      }

      // シナリオスキーマの定義
      const scenarioSchema = z.object({
        title: z.string().describe('シナリオのタイトル'),
        description: z.string().optional().describe('シナリオの説明（オプション）'),
        given: z.string().describe('Given（前提条件）'),
        when: z.string().describe('When（実行するアクション）'),
        then: z.string().describe('Then（期待される結果）'),
      });

      // シナリオリストスキーマの定義
      const scenarioListSchema = z.object({
        scenarios: z
          .array(scenarioSchema)
          .describe('仕様書から抽出されたシナリオのリスト'),
      });

      // プロンプトテンプレートの作成
      const promptTemplate = ChatPromptTemplate.fromMessages([
        [
          'system',
          `あなたはGherkin記法を使ったシナリオを作成する専門家です。
与えられた仕様書のテキストから、Gherkin記法に基づいたシナリオを抽出してください。
各シナリオには以下の要素を含めてください：
- タイトル：シナリオの簡潔な名前
- 説明（オプション）：シナリオの詳細な説明
- Given：前提条件
- When：実行するアクション
- Then：期待される結果

シナリオはユーザーストーリーに基づいて作成し、具体的かつテスト可能な形式にしてください。
仕様書に明示的に記載されている機能のみを対象とし、推測や仮定は避けてください。
各シナリオは1つの機能に対して複数のテストケースを表現できます。`,
        ],
        ['human', '{text}'],
      ]);

      // 構造化出力を持つLLMの作成
      const structuredLlm = this.llm.withStructuredOutput(scenarioListSchema, {
        name: 'scenarioList',
      });

      // プロンプトの作成と実行
      const prompt = await promptTemplate.invoke({
        text: extractScenariosDto.text,
      });

      // LLMの呼び出し
      const result = await structuredLlm.invoke(prompt);

      this.logger.log(`${result.scenarios.length}個のシナリオを抽出しました`);

      // LangChainから返されるデータをScenarioDtoの形式に変換
      const scenarios: ScenarioDto[] = result.scenarios.map((scenario: any) => ({
        title: scenario.title || 'タイトルなし',
        description: scenario.description || undefined,
        given: scenario.given || 'Given なし',
        when: scenario.when || 'When なし',
        then: scenario.then || 'Then なし',
        featureId: extractScenariosDto.featureId || '', // 機能IDが指定されていない場合は空文字
      }));

      return {
        scenarios,
      };
    } catch (error) {
      this.logger.error('シナリオ抽出中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * シナリオを保存する
   * @param saveScenarioDto 保存するシナリオのデータ
   * @returns 保存されたシナリオ
   */
  async saveScenario(saveScenarioDto: SaveScenarioDto): Promise<ScenarioDto> {
    try {
      this.logger.log('シナリオを保存します');

      const { scenario } = saveScenarioDto;

      // 機能の存在確認
      const feature = await this.prisma.feature.findUnique({
        where: { id: scenario.featureId },
      });

      if (!feature) {
        throw new NotFoundException(
          `機能ID ${scenario.featureId} が見つかりません`,
        );
      }

      // シナリオを保存
      const savedScenario = await this.prisma.scenario.create({
        data: {
          title: scenario.title,
          description: scenario.description,
          given: scenario.given,
          when: scenario.when,
          then: scenario.then,
          featureId: scenario.featureId,
        },
      });

      this.logger.log(`シナリオID ${savedScenario.id} を保存しました`);

      return savedScenario;
    } catch (error) {
      this.logger.error('シナリオ保存中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * 複数のシナリオを保存する
   * @param saveScenariosDto 保存するシナリオのデータ
   * @returns 保存されたシナリオのリスト
   */
  async saveScenarios(saveScenariosDto: SaveScenariosDto): Promise<ScenarioDto[]> {
    try {
      this.logger.log(`${saveScenariosDto.scenarios.length}個のシナリオを保存します`);

      // 機能の存在確認
      const feature = await this.prisma.feature.findUnique({
        where: { id: saveScenariosDto.featureId },
      });

      if (!feature) {
        throw new NotFoundException(
          `機能ID ${saveScenariosDto.featureId} が見つかりません`,
        );
      }

      const savedScenarios = [];

      // トランザクションを使用して、全てのシナリオを保存
      for (const scenario of saveScenariosDto.scenarios) {
        const savedScenario = await this.prisma.scenario.create({
          data: {
            title: scenario.title,
            description: scenario.description,
            given: scenario.given,
            when: scenario.when,
            then: scenario.then,
            featureId: saveScenariosDto.featureId,
          },
        });
        savedScenarios.push(savedScenario);
      }

      this.logger.log(`${savedScenarios.length}個のシナリオを保存しました`);

      return savedScenarios;
    } catch (error) {
      this.logger.error('シナリオ保存中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * 機能に関連するシナリオを取得する
   * @param featureId 機能ID
   * @returns シナリオのリスト
   */
  async getScenariosByFeatureId(featureId: string): Promise<ScenarioDto[]> {
    try {
      this.logger.log(`機能ID ${featureId} のシナリオを取得します`);

      // 機能の存在確認
      const feature = await this.prisma.feature.findUnique({
        where: { id: featureId },
      });

      if (!feature) {
        throw new NotFoundException(`機能ID ${featureId} が見つかりません`);
      }

      // 機能に関連するシナリオを取得
      const scenarios = await this.prisma.scenario.findMany({
        where: { featureId },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${scenarios.length}個のシナリオを取得しました`);

      return scenarios;
    } catch (error) {
      this.logger.error('シナリオ取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * すべてのシナリオを取得する
   * @returns シナリオのリスト
   */
  async getAllScenarios(): Promise<ScenarioDto[]> {
    try {
      this.logger.log('すべてのシナリオを取得します');

      const scenarios = await this.prisma.scenario.findMany({
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${scenarios.length}個のシナリオを取得しました`);

      return scenarios;
    } catch (error) {
      this.logger.error('シナリオ取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * シナリオを取得する
   * @param id シナリオID
   * @returns シナリオ
   */
  async getScenarioById(id: string): Promise<ScenarioDto> {
    try {
      this.logger.log(`シナリオID ${id} を取得します`);

      const scenario = await this.prisma.scenario.findUnique({
        where: { id },
      });

      if (!scenario) {
        throw new NotFoundException(`シナリオID ${id} が見つかりません`);
      }

      return scenario;
    } catch (error) {
      this.logger.error('シナリオ取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * シナリオからPlaywrightコードを生成する
   * @param id シナリオID
   * @param projectUrl プロジェクトのURL（オプション）
   * @returns 生成されたコード
   */
  async generateCode(id: string, projectUrl?: string): Promise<CodeResponseDto> {
    try {
      this.logger.log(`シナリオID ${id} のPlaywrightコードを生成します`);

      // シナリオを取得
      const scenario = await this.prisma.scenario.findUnique({
        where: { id },
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

      // プロジェクトIDを取得
      const projectId = scenario.feature?.project?.id;

      // プロジェクトのURLを取得
      let url = projectUrl;
      if (!url && projectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: projectId },
        });
        if (project) {
          url = project.url;
        }
      }

      // プロジェクトに関連するラベルを取得
      let labels = projectId
        ? await this.prisma.label.findMany({
            where: { projectId },
          })
        : [];

      // triggerActionsフィールドがJSON文字列の場合はパースする
      const parsedLabels = labels.map(label => {
        if (label.triggerActions && typeof label.triggerActions === 'string') {
          try {
            const parsedLabel = {
              ...label,
              triggerActions: JSON.parse(label.triggerActions as string)
            };
            return parsedLabel as unknown as LabelDto;
          } catch (error) {
            this.logger.warn(`ラベルID ${label.id} のtriggerActionsのJSONパースに失敗しました: ${error.message}`);
            const fallbackLabel = {
              ...label,
              triggerActions: undefined
            };
            return fallbackLabel as unknown as LabelDto;
          }
        }
        return label as unknown as LabelDto;
      });

      // Playwrightコードを生成（非同期関数に変更）
      const code = await generatePlaywrightCode(scenario, parsedLabels as unknown as LabelDto[], url);

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
   * テスト実行エラーに基づいてコードを改良する
   * @param testErrorDto テスト実行エラーのデータ
   * @returns 改良されたコード
   */
  async improveCode(testErrorDto: TestErrorDto): Promise<CodeResponseDto> {
    try {
      this.logger.log(`シナリオID ${testErrorDto.scenarioId} のPlaywrightコードを改良します（試行回数: ${testErrorDto.attemptNumber}）`);

      // シナリオを取得
      const scenario = await this.prisma.scenario.findUnique({
        where: { id: testErrorDto.scenarioId },
        include: {
          feature: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!scenario) {
        throw new NotFoundException(`シナリオID ${testErrorDto.scenarioId} が見つかりません`);
      }

      // プロジェクトIDを取得
      const projectId = scenario.feature?.project?.id;

      // プロジェクトのURLを取得
      let url = testErrorDto.projectUrl;
      if (!url && projectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: projectId },
        });
        if (project) {
          url = project.url;
        }
      }

      // プロジェクトに関連するラベルを取得
      let labels = projectId
        ? await this.prisma.label.findMany({
            where: { projectId },
          })
        : [];

      // triggerActionsフィールドがJSON文字列の場合はパースする
      const parsedLabels = labels.map(label => {
        if (label.triggerActions && typeof label.triggerActions === 'string') {
          try {
            const parsedLabel = {
              ...label,
              triggerActions: JSON.parse(label.triggerActions as string)
            };
            return parsedLabel as unknown as LabelDto;
          } catch (error) {
            this.logger.warn(`ラベルID ${label.id} のtriggerActionsのJSONパースに失敗しました: ${error.message}`);
            const fallbackLabel = {
              ...label,
              triggerActions: undefined
            };
            return fallbackLabel as unknown as LabelDto;
          }
        }
        return label as unknown as LabelDto;
      });

      // プロンプトテンプレートの作成
      const promptTemplate = ChatPromptTemplate.fromMessages([
        [
          'system',
          `あなたはPlaywrightのテストコードを改良する専門家です。
与えられたシナリオ、ラベル情報、現在のコード、およびエラー情報から、より堅牢なPlaywrightテストコードを生成してください。

エラー情報を注意深く分析し、以下の点に特に注意してコードを改良してください：
1. 要素の可視性や存在の確認
2. 適切なタイミングでの待機処理
3. 堅牢なセレクタの使用
4. エラーハンドリング
5. テスト実行の安定性向上

生成するコードは以下の要件を満たす必要があります：
- TypeScriptで記述すること
- Playwrightのtest関数とexpect関数を使用すること
- セレクタ変数を定義し、ラベル情報を活用すること
- Given、When、Thenの各ステップに対応するコードを生成すること
- コードにはコメントを含め、理解しやすくすること
- 実行可能な完全なテストコードを生成すること

コードは以下の構造を持つ必要があります：
1. ファイルの先頭にコメントとimport文
2. シナリオのタイトルと説明を含むJSDocコメント
3. test関数の呼び出し
4. セレクタ変数の定義
5. Given、When、Thenの各ステップに対応するコード

ラベル情報を最大限に活用し、シナリオの内容に基づいて適切なアクションと検証を実装してください。

前回の実行で発生したエラーを分析し、その原因を特定して修正してください。エラーの原因として考えられるものと、それに対する対策をコメントとして含めてください。`,
        ],
        [
          'human',
          `シナリオ情報:
タイトル: {scenario.title}
説明: {scenario.description || '説明なし'}
Given: {scenario.given}
When: {scenario.when}
Then: {scenario.then}

現在のコード:
{testErrorDto.code}

エラー情報:
{testErrorDto.errorMessage}

スタックトレース:
{testErrorDto.stackTrace || 'スタックトレースなし'}

試行回数: {testErrorDto.attemptNumber}

プロジェクトURL: {url || 'URLなし'}

利用可能なラベル情報:
{parsedLabels.length > 0 ? JSON.stringify(parsedLabels, null, 2) : 'ラベル情報なし'}

上記の情報を元に、エラーを修正した改良版のPlaywrightテストコードを生成してください。`,
        ],
      ]);

      // プロンプトの作成と実行
      const prompt = await promptTemplate.format({
        scenario,
        testErrorDto,
        url,
        parsedLabels,
      });

      // LLMの呼び出し
      const result = await this.llm.invoke(prompt);

      // 生成されたコードを抽出
      const content = result.content as string;
      // コードブロックを抽出する正規表現
      const codeBlockRegex = /```(?:typescript|js|javascript)?(.*?)```/s;
      const match = content.match(codeBlockRegex);
      const code = match ? match[1].trim() : content;

      this.logger.log(`シナリオID ${testErrorDto.scenarioId} のPlaywrightコードを改良しました（試行回数: ${testErrorDto.attemptNumber}）`);

      return {
        code,
        scenarioId: testErrorDto.scenarioId,
        generationAttempt: testErrorDto.attemptNumber,
        previousError: testErrorDto.errorMessage,
      };
    } catch (error) {
      this.logger.error('コード改良中にエラーが発生しました', error.stack);
      throw error;
    }
  }
}
