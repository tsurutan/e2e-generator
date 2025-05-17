export class ExtractScenariosDto {
  /**
   * 仕様書のテキスト内容
   * @example "ログイン機能を実装する。ユーザーはメールアドレスとパスワードでログインできる。"
   */
  text: string;

  /**
   * 関連付ける機能のID（オプション）
   */
  featureId?: string;

  /**
   * ファイル名（オプション）
   * @example "login-spec.txt"
   */
  fileName?: string;

  /**
   * ファイルタイプ（オプション）
   * @example "text/plain"
   */
  fileType?: string;
}
