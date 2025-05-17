export class ScenarioDto {
  /**
   * シナリオのID（データベースから取得する場合のみ）
   */
  id?: string;

  /**
   * シナリオのタイトル
   * @example "ユーザーがログインする"
   */
  title: string;

  /**
   * シナリオの説明（オプション）
   * @example "ユーザーが正しい認証情報でログインする基本フロー"
   */
  description?: string;

  /**
   * Given（前提条件）
   * @example "ユーザーがログインページにアクセスしている"
   */
  given: string;

  /**
   * When（実行するアクション）
   * @example "ユーザーが有効なメールアドレスとパスワードを入力してログインボタンをクリックする"
   */
  when: string;

  /**
   * Then（期待される結果）
   * @example "ユーザーはダッシュボードページにリダイレクトされる"
   */
  then: string;

  /**
   * 関連する機能のID
   */
  featureId: string;

  /**
   * 作成日時（データベースから取得する場合のみ）
   */
  createdAt?: Date;

  /**
   * 更新日時（データベースから取得する場合のみ）
   */
  updatedAt?: Date;
}
