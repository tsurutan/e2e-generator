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
}
