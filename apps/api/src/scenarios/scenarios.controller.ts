import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import {
  ScenarioDto,
  ScenarioListDto,
  SaveScenarioDto,
  SaveScenariosDto,
  ExtractScenariosDto,
} from './dto';

@Controller('scenarios')
export class ScenariosController {
  private readonly logger = new Logger(ScenariosController.name);

  constructor(private readonly scenariosService: ScenariosService) {}

  /**
   * 仕様書からシナリオを抽出するエンドポイント
   * @param extractScenariosDto 仕様書データ
   * @returns 抽出されたシナリオのリスト
   */
  @Post('extract')
  async extractScenarios(
    @Body() extractScenariosDto: ExtractScenariosDto,
  ): Promise<ScenarioListDto> {
    this.logger.log('仕様書からシナリオを抽出するリクエストを受信しました');
    return this.scenariosService.extractScenarios(extractScenariosDto);
  }

  /**
   * シナリオを保存するエンドポイント
   * @param saveScenarioDto 保存するシナリオのデータ
   * @returns 保存されたシナリオ
   */
  @Post('save')
  async saveScenario(@Body() saveScenarioDto: SaveScenarioDto): Promise<ScenarioDto> {
    this.logger.log('シナリオを保存するリクエストを受信しました');
    return this.scenariosService.saveScenario(saveScenarioDto);
  }

  /**
   * 複数のシナリオを保存するエンドポイント
   * @param saveScenariosDto 保存するシナリオのデータ
   * @returns 保存されたシナリオのリスト
   */
  @Post('save-multiple')
  async saveScenarios(
    @Body() saveScenariosDto: SaveScenariosDto,
  ): Promise<ScenarioDto[]> {
    this.logger.log('複数のシナリオを保存するリクエストを受信しました');
    return this.scenariosService.saveScenarios(saveScenariosDto);
  }

  /**
   * 機能に関連するシナリオを取得するエンドポイント
   * @param featureId 機能ID
   * @returns シナリオのリスト
   */
  @Get('feature/:featureId')
  async getScenariosByFeatureId(
    @Param('featureId') featureId: string,
  ): Promise<ScenarioDto[]> {
    this.logger.log(`機能ID ${featureId} のシナリオを取得するリクエストを受信しました`);
    return this.scenariosService.getScenariosByFeatureId(featureId);
  }

  /**
   * すべてのシナリオを取得するエンドポイント
   * @returns シナリオのリスト
   */
  @Get()
  async getAllScenarios(): Promise<ScenarioDto[]> {
    this.logger.log('すべてのシナリオを取得するリクエストを受信しました');
    return this.scenariosService.getAllScenarios();
  }

  /**
   * シナリオを取得するエンドポイント
   * @param id シナリオID
   * @returns シナリオ
   */
  @Get(':id')
  async getScenarioById(@Param('id') id: string): Promise<ScenarioDto> {
    this.logger.log(`シナリオID ${id} を取得するリクエストを受信しました`);
    return this.scenariosService.getScenarioById(id);
  }
}
