/**
 * トリガーアクションの型定義
 */
export interface TriggerAction {
  /**
   * アクションのタイプ（クリック、入力など）
   * @example "click"
   */
  type: string;

  /**
   * アクション対象要素のセレクタ
   * @example "button.login-button"
   */
  selector: string;

  /**
   * アクション対象要素のテキスト（オプション）
   * @example "ログイン"
   */
  text?: string;

  /**
   * アクションが発生した時刻
   * @example "2023-01-01T12:34:56.789Z"
   */
  timestamp: string;
}

export class LabelDto {
  /**
   * ラベルのID（データベースから取得する場合のみ）
   */
  id?: string;

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
   * 要素表示のトリガーとなったアクション情報（オプション）
   * 動的に表示される要素（モーダルなど）の場合に使用
   */
  triggerActions?: TriggerAction[];

  /**
   * 関連するプロジェクトのID
   */
  projectId: string;

  /**
   * 作成日時（データベースから取得する場合のみ）
   */
  createdAt?: Date;

  /**
   * 更新日時（データベースから取得する場合のみ）
   */
  updatedAt?: Date;
}
