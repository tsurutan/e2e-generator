export class UploadSpecificationDto {
  /**
   * 仕様書のテキスト内容
   * @example "ログイン機能を実装する。ユーザーはメールアドレスとパスワードでログインできる。"
   */
  text: string;

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

  /**
   * 関連付けるプロジェクトのID（オプション）
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  projectId?: string;
}
