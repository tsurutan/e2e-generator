import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelDto } from './dto/label.dto';
import { SaveLabelDto } from './dto/save-label.dto';

@Controller('labels')
export class LabelsController {
  private readonly logger = new Logger(LabelsController.name);

  constructor(private readonly labelsService: LabelsService) {}

  /**
   * ラベルを保存するエンドポイント
   * @param saveLabelDto 保存するラベルのデータ
   * @returns 保存されたラベル
   */
  @Post('save')
  async saveLabel(@Body() saveLabelDto: SaveLabelDto): Promise<LabelDto> {
    this.logger.log('ラベルを保存するリクエストを受信しました');
    return this.labelsService.saveLabel(saveLabelDto);
  }

  /**
   * プロジェクトに関連するラベルを取得するエンドポイント
   * @param projectId プロジェクトID
   * @returns ラベルのリスト
   */
  @Get('project/:projectId')
  async getLabelsByProjectId(@Param('projectId') projectId: string): Promise<LabelDto[]> {
    this.logger.log(`プロジェクトID ${projectId} のラベルを取得するリクエストを受信しました`);
    return this.labelsService.getLabelsByProjectId(projectId);
  }

  /**
   * すべてのラベルを取得するエンドポイント
   * @returns ラベルのリスト
   */
  @Get()
  async getAllLabels(): Promise<LabelDto[]> {
    this.logger.log('すべてのラベルを取得するリクエストを受信しました');
    return this.labelsService.getAllLabels();
  }

  /**
   * URLに関連するラベルを取得するエンドポイント
   * @param url URL
   * @param projectId プロジェクトID
   * @returns ラベルのリスト
   */
  @Get('url')
  async getLabelsByUrl(
    @Query('url') url: string,
    @Query('projectId') projectId: string,
  ): Promise<LabelDto[]> {
    this.logger.log(`URL ${url} のラベルを取得するリクエストを受信しました`);
    return this.labelsService.getLabelsByUrl(url, projectId);
  }
}
