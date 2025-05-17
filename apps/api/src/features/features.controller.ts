import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { UploadSpecificationDto } from './dto/upload-specification.dto';
import { FeatureListDto } from './dto/feature-list.dto';
import { FeatureDto } from './dto/feature.dto';
import { SaveFeaturesDto } from './dto/save-features.dto';

@Controller('features')
export class FeaturesController {
  private readonly logger = new Logger(FeaturesController.name);

  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * 仕様書から機能一覧を抽出するエンドポイント
   * @param uploadSpecificationDto 仕様書データ
   * @returns 抽出された機能一覧
   */
  @Post('extract')
  async extractFeatures(
    @Body() uploadSpecificationDto: UploadSpecificationDto,
  ): Promise<FeatureListDto> {
    this.logger.log('仕様書から機能一覧を抽出するリクエストを受信しました');
    return this.featuresService.extractFeatures(uploadSpecificationDto);
  }

  /**
   * 機能を保存するエンドポイント
   * @param saveFeaturesDto 保存する機能のデータ
   * @returns 保存された機能のリスト
   */
  @Post('save')
  async saveFeatures(@Body() saveFeaturesDto: SaveFeaturesDto): Promise<FeatureDto[]> {
    this.logger.log('機能を保存するリクエストを受信しました');
    return this.featuresService.saveFeatures(saveFeaturesDto);
  }

  /**
   * プロジェクトに関連する機能を取得するエンドポイント
   * @param projectId プロジェクトID
   * @returns 機能のリスト
   */
  @Get('project/:projectId')
  async getFeaturesByProjectId(@Param('projectId') projectId: string): Promise<FeatureDto[]> {
    this.logger.log(`プロジェクトID ${projectId} の機能を取得するリクエストを受信しました`);
    return this.featuresService.getFeaturesByProjectId(projectId);
  }

  /**
   * すべての機能を取得するエンドポイント
   * @returns 機能のリスト
   */
  @Get()
  async getAllFeatures(): Promise<FeatureDto[]> {
    this.logger.log('すべての機能を取得するリクエストを受信しました');
    return this.featuresService.getAllFeatures();
  }
}
