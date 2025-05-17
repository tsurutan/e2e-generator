import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabelDto } from './dto/label.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { SaveLabelDto } from './dto/save-label.dto';

@Injectable()
export class LabelsService {
  private readonly logger = new Logger(LabelsService.name);

  constructor(private prisma: PrismaService) {}

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
}
