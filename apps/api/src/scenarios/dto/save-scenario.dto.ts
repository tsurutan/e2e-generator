import { CreateScenarioDto } from './create-scenario.dto';

export class SaveScenarioDto {
  /**
   * 保存するシナリオ
   */
  scenario: CreateScenarioDto;
}
