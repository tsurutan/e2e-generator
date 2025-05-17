export class GenerateCodeDto {
  /**
   * シナリオのID
   */
  scenarioId: string;

  /**
   * プロジェクトのURL（オプション）
   * @example "https://example.com"
   */
  projectUrl?: string;
}
