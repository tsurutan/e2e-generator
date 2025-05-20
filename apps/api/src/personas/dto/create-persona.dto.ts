import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreatePersonaDto {
  /**
   * ペルソナの名前
   * @example "テストユーザー"
   */
  @IsNotEmpty({ message: '名前は必須です' })
  @IsString({ message: '名前は文字列である必要があります' })
  name: string;

  /**
   * ペルソナのメールアドレス
   * @example "test@example.com"
   */
  @IsNotEmpty({ message: 'メールアドレスは必須です' })
  @IsEmail({}, { message: '有効なメールアドレスを入力してください' })
  email: string;

  /**
   * ペルソナのパスワード
   * @example "password123"
   */
  @IsNotEmpty({ message: 'パスワードは必須です' })
  @IsString({ message: 'パスワードは文字列である必要があります' })
  @MinLength(8, { message: 'パスワードは8文字以上である必要があります' })
  password: string;

  /**
   * 関連するプロジェクトのID
   */
  @IsNotEmpty({ message: 'プロジェクトIDは必須です' })
  @IsString({ message: 'プロジェクトIDは文字列である必要があります' })
  projectId: string;
}
