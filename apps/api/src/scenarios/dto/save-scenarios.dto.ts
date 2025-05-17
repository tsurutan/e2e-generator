import { CreateScenarioDto } from './create-scenario.dto';

export class SaveScenariosDto {
  /**
   * 保存するシナリオのリスト
   */
  scenarios: CreateScenarioDto[];

  /**
   * 関連付ける機能のID
   */
  featureId: string;
}
