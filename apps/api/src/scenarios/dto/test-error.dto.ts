export class TestErrorDto {
  /**
   * シナリオのID
   */
  scenarioId: string;

  /**
   * 生成されたコード
   */
  code: string;

  /**
   * テスト実行中に発生したエラーメッセージ
   */
  errorMessage: string;

  /**
   * エラーのスタックトレース（存在する場合）
   */
  stackTrace?: string;

  /**
   * 試行回数
   */
  attemptNumber: number;

  /**
   * プロジェクトのURL（オプション）
   */
  projectUrl?: string;
}
