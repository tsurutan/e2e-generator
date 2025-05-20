import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePersonaDto {
  /**
   * ペルソナの名前
   * @example "テストユーザー"
   */
  @IsOptional()
  @IsString({ message: '名前は文字列である必要があります' })
  name?: string;

  /**
   * ペルソナのメールアドレス
   * @example "test@example.com"
   */
  @IsOptional()
  @IsEmail({}, { message: '有効なメールアドレスを入力してください' })
  email?: string;

  /**
   * ペルソナのパスワード
   * @example "password123"
   */
  @IsOptional()
  @IsString({ message: 'パスワードは文字列である必要があります' })
  @MinLength(8, { message: 'パスワードは8文字以上である必要があります' })
  password?: string;
}
