export class UiStateDto {
  /**
   * UIStateのID（データベースから取得する場合のみ）
   */
  id?: string;

  /**
   * UIStateのタイトル
   * @example "ログインページ初期状態"
   */
  title: string;

  /**
   * UIStateの説明
   * @example "ユーザーがログインページにアクセスした時の初期状態"
   */
  description: string;

  /**
   * このUIStateが存在するページのURL
   * @example "https://example.com/login"
   */
  pageUrl: string;

  /**
   * 関連するプロジェクトのID
   */
  projectId: string;

  /**
   * このUIStateがページのデフォルトのUIStateかどうか
   * ページごとに1つだけ存在する
   */
  isDefault?: boolean;

  /**
   * 作成日時（データベースから取得する場合のみ）
   */
  createdAt?: Date;

  /**
   * 更新日時（データベースから取得する場合のみ）
   */
  updatedAt?: Date;
}

export class CreateUiStateDto {
  /**
   * UIStateのタイトル
   * @example "ログインページ初期状態"
   */
  title: string;

  /**
   * UIStateの説明
   * @example "ユーザーがログインページにアクセスした時の初期状態"
   */
  description: string;

  /**
   * このUIStateが存在するページのURL
   * @example "https://example.com/login"
   */
  pageUrl: string;

  /**
   * 関連するプロジェクトのID
   */
  projectId: string;
  html?: string;

  /**
   * このUIStateがページのデフォルトのUIStateかどうか
   * ページごとに1つだけ存在する
   */
  isDefault?: boolean;
}

export class UpdateUiStateDto {
  /**
   * UIStateのタイトル
   * @example "ログインページ初期状態"
   */
  title?: string;

  /**
   * UIStateの説明
   * @example "ユーザーがログインページにアクセスした時の初期状態"
   */
  description?: string;

  /**
   * このUIStateが存在するページのURL
   * @example "https://example.com/login"
   */
  pageUrl?: string;

  /**
   * このUIStateがページのデフォルトのUIStateかどうか
   * ページごとに1つだけ存在する
   */
  isDefault?: boolean;
}
