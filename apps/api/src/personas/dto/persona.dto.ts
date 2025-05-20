export class PersonaDto {
  /**
   * ペルソナのID（データベースから取得する場合のみ）
   */
  id?: string;

  /**
   * ペルソナの名前
   * @example "テストユーザー"
   */
  name: string;

  /**
   * ペルソナのメールアドレス
   * @example "test@example.com"
   */
  email: string;

  /**
   * ペルソナのパスワード
   * @example "password123"
   */
  password: string;

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
