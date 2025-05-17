import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { UploadSpecificationDto } from './dto/upload-specification.dto';
import { FeatureListDto } from './dto/feature-list.dto';
import { FeatureDto } from './dto/feature.dto';
import { SaveFeaturesDto } from './dto/save-features.dto';

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);
  private readonly llm: ChatOpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
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
