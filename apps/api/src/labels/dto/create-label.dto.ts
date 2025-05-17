export class CreateLabelDto {
  /**
   * ラベルの名前
   * @example "ログインボタン"
   */
  name: string;

  /**
   * ラベルの説明
   * @example "ユーザーがログインするためのボタン"
   */
  description?: string;

  /**
   * 要素のCSSセレクタ
   * @example "button.login-button"
   */
  selector: string;

  /**
   * 要素のXPath（オプション）
   * @example "/html/body/div[1]/div/div[2]/form/button"
   */
  xpath?: string;

  /**
   * 要素のテキスト内容（オプション）
   * @example "ログイン"
   */
  elementText?: string;

  /**
   * ラベルが登録されたページのURL
   * @example "https://example.com/login"
   */
  url: string;

  /**
   * URLのクエリパラメータ部分（オプション）
   * @example "?redirect=dashboard&theme=dark"
   */
  queryParams?: string;

  /**
   * 関連するプロジェクトのID
   */
  projectId: string;
}
