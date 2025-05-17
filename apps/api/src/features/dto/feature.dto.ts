export class FeatureDto {
  /**
   * 機能のID（データベースから取得する場合のみ）
   */
  id?: string;

  /**
   * 機能の名前
   * @example "ユーザーログイン"
   */
  name: string;

  /**
   * 機能の説明
   * @example "ユーザーがメールアドレスとパスワードを使用してシステムにログインする機能"
   */
  description: string;

  /**
   * 作成日時（データベースから取得する場合のみ）
   */
  createdAt?: Date;

  /**
   * 更新日時（データベースから取得する場合のみ）
   */
  updatedAt?: Date;

  /**
   * 関連するプロジェクトのID
   */
  projectId?: string;
}
