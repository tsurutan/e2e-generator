export class CodeResponseDto {
  /**
   * 生成されたコード
   */
  code: string;

  /**
   * シナリオのID
   */
  scenarioId: string;

  /**
   * 生成回数（リトライの場合に増加）
   */
  generationAttempt?: number;

  /**
   * 前回のエラー情報（リトライの場合に設定）
   */
  previousError?: string;
}
