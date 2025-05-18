import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LabelDto } from './dto/label.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { SaveLabelDto } from './dto/save-label.dto';
import { AutoGenerateLabelsDto } from './dto/auto-generate-labels.dto';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

@Injectable()
export class LabelsService {
  private readonly logger = new Logger(LabelsService.name);
  private readonly llm: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    // OpenAI APIの初期化
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'gpt-4o',
      temperature: 0,
    });
  }

  /**
   * ラベルを保存する
   * @param saveLabelDto 保存するラベルのデータ
   * @returns 保存されたラベル
   */
  async saveLabel(saveLabelDto: SaveLabelDto): Promise<LabelDto> {
    try {
      this.logger.log('ラベルを保存します');

      const { label } = saveLabelDto;

      // プロジェクトの存在確認
      const project = await this.prisma.project.findUnique({
        where: { id: label.projectId },
      });

      if (!project) {
        throw new NotFoundException(
          `プロジェクトID ${label.projectId} が見つかりません`,
        );
      }

      // ラベルを保存
      const savedLabel = await this.prisma.label.create({
        data: {
          name: label.name,
          description: label.description,
          selector: label.selector,
          xpath: label.xpath,
          elementText: label.elementText,
          url: label.url,
          queryParams: label.queryParams,
          projectId: label.projectId,
        },
      });

      this.logger.log(`ラベルID ${savedLabel.id} を保存しました`);

      return savedLabel;
    } catch (error) {
      this.logger.error('ラベル保存中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * プロジェクトに関連するラベルを取得する
   * @param projectId プロジェクトID
   * @returns ラベルのリスト
   */
  async getLabelsByProjectId(projectId: string): Promise<LabelDto[]> {
    try {
      this.logger.log(`プロジェクトID ${projectId} のラベルを取得します`);

      // プロジェクトの存在確認
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(
          `プロジェクトID ${projectId} が見つかりません`,
        );
      }

      // ラベルを取得
      const labels = await this.prisma.label.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${labels.length}個のラベルを取得しました`);

      return labels;
    } catch (error) {
      this.logger.error('ラベル取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * すべてのラベルを取得する
   * @returns ラベルのリスト
   */
  async getAllLabels(): Promise<LabelDto[]> {
    try {
      this.logger.log('すべてのラベルを取得します');

      const labels = await this.prisma.label.findMany({
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${labels.length}個のラベルを取得しました`);

      return labels;
    } catch (error) {
      this.logger.error('ラベル取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * 特定のURLに関連するラベルを取得する
   * @param url URL
   * @param projectId プロジェクトID
   * @returns ラベルのリスト
   */
  async getLabelsByUrl(url: string, projectId: string): Promise<LabelDto[]> {
    try {
      this.logger.log(`URL ${url} のラベルを取得します`);

      // プロジェクトの存在確認
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(
          `プロジェクトID ${projectId} が見つかりません`,
        );
      }

      // URLからクエリパラメータを除去した基本URLを取得
      let baseUrl = url;
      try {
        const urlObj = new URL(url);
        if (urlObj.search) {
          baseUrl = url.replace(urlObj.search, '');
        }
      } catch (error) {
        this.logger.warn(`URLの解析に失敗しました: ${error.message}`);
      }

      // ラベルを取得
      const labels = await this.prisma.label.findMany({
        where: {
          projectId,
          url: baseUrl,
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`${labels.length}個のラベルを取得しました`);

      return labels;
    } catch (error) {
      this.logger.error('ラベル取得中にエラーが発生しました', error.stack);
      throw error;
    }
  }

  /**
   * HTMLコンテンツからラベルを自動生成する
   * @param autoGenerateLabelsDto HTMLコンテンツとURL情報
   * @returns 生成されたラベルのリスト
   */
  async autoGenerateLabels(autoGenerateLabelsDto: AutoGenerateLabelsDto): Promise<LabelDto[]> {
    try {
      this.logger.log('HTMLコンテンツからラベルを自動生成します');

      // プロジェクトの存在確認
      const project = await this.prisma.project.findUnique({
        where: { id: autoGenerateLabelsDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(
          `プロジェクトID ${autoGenerateLabelsDto.projectId} が見つかりません`,
        );
      }

      // URLからクエリパラメータを除去した基本URLを取得
      let baseUrl = autoGenerateLabelsDto.url;
      try {
        const urlObj = new URL(autoGenerateLabelsDto.url);
        if (urlObj.search) {
          baseUrl = autoGenerateLabelsDto.url.replace(urlObj.search, '');
        }
      } catch (error) {
        this.logger.warn(`URLの解析に失敗しました: ${error.message}`);
      }

      // ラベルスキーマの定義
      const labelSchema = z.object({
        name: z.string().describe('ラベルの名前'),
        description: z.string().describe('ラベルの説明'),
        selector: z.string().describe('要素のCSSセレクタ'),
        elementText: z.string().optional().describe('要素のテキスト内容（オプション）'),
      });

      // ラベルリストスキーマの定義
      const labelListSchema = z.object({
        labels: z
          .array(labelSchema)
          .describe('HTMLから抽出されたラベルのリスト'),
      });

      // プロンプトテンプレートの作成
      const promptTemplate = ChatPromptTemplate.fromMessages([
        [
          'system',
          `あなたはWebページからUI要素を特定し、テスト自動化のためのラベルを生成する専門家です。
与えられたHTMLコンテンツから、テスト自動化に重要なUI要素を特定し、それぞれにラベルを付けてください。

以下のような要素に注目してください：
- ボタン、リンク、フォーム要素（入力フィールド、チェックボックス、ラジオボタンなど）
- ナビゲーション要素（メニュー、タブなど）
- 重要な情報を表示する要素（見出し、テキスト領域など）

各ラベルには以下の情報を含めてください：
- name: 要素の役割や機能を簡潔に表す名前（例：「ログインボタン」「検索フィールド」）
- description: 要素の詳細な説明や用途
- selector: 要素を一意に特定するためのCSSセレクタ
- elementText: 要素に含まれるテキスト（存在する場合）

正確なCSSセレクタを生成することが重要です。id、class、属性などを使用して、できるだけ具体的かつ一意になるようにしてください。`,
        ],
        ['human', '{htmlContent}'],
      ]);

      // 構造化出力を持つLLMの作成
      const structuredLlm = this.llm.withStructuredOutput(labelListSchema, {
        name: 'labelList',
      });

      // プロンプトの作成と実行
      const prompt = await promptTemplate.invoke({
        htmlContent: autoGenerateLabelsDto.htmlContent,
      });

      // LLMの呼び出し
      const result = await structuredLlm.invoke(prompt);

      this.logger.log(`${result.labels.length}個のラベルを生成しました`);

      // LangChainから返されるデータをLabelDtoの形式に変換
      const labels: LabelDto[] = result.labels.map((label: any) => ({
        name: label.name || '名称なし',
        description: label.description || '',
        selector: label.selector,
        elementText: label.elementText || '',
        url: baseUrl,
        queryParams: autoGenerateLabelsDto.queryParams,
        projectId: autoGenerateLabelsDto.projectId,
      }));

      return labels;
    } catch (error) {
      this.logger.error('ラベル自動生成中にエラーが発生しました', error.stack);
      throw error;
    }
  }
}
