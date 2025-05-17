import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ScenariosService } from '../scenarios/scenarios.service';
import { UploadSpecificationDto } from './dto/upload-specification.dto';
import { FeatureListDto } from './dto/feature-list.dto';
import { FeatureDto } from './dto/feature.dto';
import { SaveFeaturesDto } from './dto/save-features.dto';

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);
  private readonly llm: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly scenariosService: ScenariosService,
  ) {
    // OpenAI APIの初期化
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'gpt-4o',
      temperature: 0,
    });
  }

  /**
   * 仕様書から機能一覧を抽出する
   * @param uploadSpecificationDto 仕様書データ
   * @returns 抽出された機能一覧
   */
  async extractFeatures(
    uploadSpecificationDto: UploadSpecificationDto,
  ): Promise<FeatureListDto> {
    try {
      this.logger.log('仕様書から機能一覧を抽出します');

      // projectIdが指定されている場合は、プロジェクトが存在するか確認
      if (uploadSpecificationDto.projectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: uploadSpecificationDto.projectId },
        });

        if (!project) {
          throw new NotFoundException(`プロジェクトID ${uploadSpecificationDto.projectId} が見つかりません`);
        }

        this.logger.log(`プロジェクトID ${uploadSpecificationDto.projectId} の機能を抽出します`);
      } else {
        this.logger.warn('プロジェクトIDが指定されていません');
      }

      // 機能スキーマの定義
      const featureSchema = z.object({
        name: z.string().describe('機能の名前'),
        description: z.string().describe('機能の詳細な説明'),
      });

      // 機能リストスキーマの定義
      const featureListSchema = z.object({
        features: z
          .array(featureSchema)
          .describe('仕様書から抽出された機能のリスト'),
      });

      // プロンプトテンプレートの作成
      const promptTemplate = ChatPromptTemplate.fromMessages([
        [
          'system',
          `あなたは仕様書から機能一覧を抽出する専門家です。
与えられた仕様書のテキストから、実装すべき機能を抽出してください。
各機能には名前と説明を含めてください。
機能名は簡潔に、説明は詳細に記述してください。
仕様書に明示的に記載されている機能のみを抽出し、推測や仮定は避けてください。`,
        ],
        ['human', '{text}'],
      ]);

      // 構造化出力を持つLLMの作成
      const structuredLlm = this.llm.withStructuredOutput(featureListSchema, {
        name: 'featureList',
      });

      // プロンプトの作成と実行
      const prompt = await promptTemplate.invoke({
        text: uploadSpecificationDto.text,
      });

      // LLMの呼び出し
      const result = await structuredLlm.invoke(prompt);

      this.logger.log(`${result.features.length}個の機能を抽出しました`);

      // LangChainから返されるデータをFeatureDtoの形式に変換
      const features: FeatureDto[] = result.features.map((feature: any) => ({
        name: feature.name || '名称なし', // nameがない場合はデフォルト値を設定
        description: feature.description || '説明なし', // descriptionがない場合はデフォルト値を設定
        projectId: uploadSpecificationDto.projectId, // プロジェクトIDを設定
      }));

      return {
        features,
      };
    } catch (error) {
      this.logger.error('機能抽出中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * 機能をデータベースに保存する
   * @param saveFeaturesDto 保存する機能のデータ
   * @returns 保存された機能のリスト
   */
  async saveFeatures(saveFeaturesDto: SaveFeaturesDto): Promise<FeatureDto[]> {
    try {
      this.logger.log(`${saveFeaturesDto.features.length}個の機能を保存します`);

      // projectIdが必要
      if (!saveFeaturesDto.projectId) {
        throw new Error('プロジェクトIDが指定されていません');
      }

      // プロジェクトが存在するか確認
      const project = await this.prisma.project.findUnique({
        where: { id: saveFeaturesDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(`プロジェクトID ${saveFeaturesDto.projectId} が見つかりません`);
      }

      const savedFeatures = [];

      // トランザクションを使用して、全ての機能を保存
      for (const feature of saveFeaturesDto.features) {
        const savedFeature = await this.prisma.feature.create({
          data: {
            name: feature.name,
            description: feature.description,
            projectId: saveFeaturesDto.projectId,
          },
        });
        savedFeatures.push(savedFeature);

        // 機能の説明からシナリオを自動生成して保存
        try {
          const extractResult = await this.scenariosService.extractScenarios({
            text: feature.description,
            featureId: savedFeature.id,
          });

          if (extractResult.scenarios.length > 0) {
            await this.scenariosService.saveScenarios({
              scenarios: extractResult.scenarios,
              featureId: savedFeature.id,
            });
            this.logger.log(
              `機能ID ${savedFeature.id} に対して ${extractResult.scenarios.length} 個のシナリオを自動生成しました`,
            );
          }
        } catch (scenarioError) {
          this.logger.error(
            `機能ID ${savedFeature.id} のシナリオ自動生成中にエラーが発生しました`,
            scenarioError.stack,
          );
          // シナリオ生成エラーは無視して処理を続行
        }
      }

      this.logger.log(`${savedFeatures.length}個の機能を保存しました`);

      return savedFeatures;
    } catch (error) {
      this.logger.error('機能保存中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * プロジェクトに関連する機能を取得する
   * @param projectId プロジェクトID
   * @returns 機能のリスト
   */
  async getFeaturesByProjectId(projectId: string): Promise<FeatureDto[]> {
    try {
      this.logger.log(`プロジェクトID ${projectId} の機能を取得します`);

      // プロジェクトが存在するか確認
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(`プロジェクトID ${projectId} が見つかりません`);
      }

      // プロジェクトに関連する機能を取得
      const features = await this.prisma.feature.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${features.length}個の機能を取得しました`);

      return features;
    } catch (error) {
      this.logger.error('機能取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * すべての機能を取得する
   * @returns 機能のリスト
   */
  async getAllFeatures(): Promise<FeatureDto[]> {
    try {
      this.logger.log('すべての機能を取得します');

      const features = await this.prisma.feature.findMany({
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${features.length}個の機能を取得しました`);

      return features;
    } catch (error) {
      this.logger.error('機能取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }
}
