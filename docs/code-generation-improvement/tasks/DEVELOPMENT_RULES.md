# 開発共通ルール

## 概要

このファイルは、TestPilotプロジェクトのコード生成精度向上タスクを実行する際に、**全ての開発者が絶対に守るべき共通ルール**を定義しています。

**⚠️ 重要**: これらのルールは全てのタスクで必須であり、例外は認められません。

## 🔧 品質保証ルール

### Rule 1: 品質チェックの完全実行
```bash
# 各テスト完了後、以下のコマンドが全て通ること
npm run check-types  # TypeScript型チェック
npm run lint         # ESLintチェック  
npm run test         # 全テスト実行
```

**適用タイミング**: 
- 各機能実装完了時
- プルリクエスト作成前
- コミット前

**違反時の対応**: 
- 全てのエラー・警告を修正するまで次の作業に進まない
- 必要に応じてコード全体をリファクタリング

---

### Rule 2: ファイルサイズ制限とリファクタリング
```typescript
// ❌ 悪い例: 600行を超える巨大ファイル
// src/scenarios/scenarios.service.ts (800行)

// ✅ 良い例: 機能別に分割
// src/scenarios/scenarios.service.ts (300行)
// src/scenarios/utils/code-generator.service.ts (250行)
// src/scenarios/utils/context-builder.service.ts (200行)
```

**適用基準**:
- 単一ファイルが600行を超えた場合、即座にリファクタリング実行
- 機能別、責任別にファイルを分割
- 共通ロジックは別ファイルに抽出

**リファクタリング手順**:
1. 機能の責任範囲を明確化
2. 共通ロジックを特定
3. 新しいファイルに分割
4. インポート・エクスポートを整理
5. テストが全て通ることを確認

---

### Rule 3: DRY原則の徹底
```typescript
// ❌ 悪い例: 重複コード
function validateLoginForm(email: string, password: string) {
  if (!email || email.length === 0) return false;
  if (!password || password.length === 0) return false;
  return true;
}

function validateSignupForm(email: string, password: string, name: string) {
  if (!email || email.length === 0) return false;
  if (!password || password.length === 0) return false;
  if (!name || name.length === 0) return false;
  return true;
}

// ✅ 良い例: 共通ロジックを抽出
function validateRequired(value: string): boolean {
  return value && value.length > 0;
}

function validateLoginForm(email: string, password: string) {
  return validateRequired(email) && validateRequired(password);
}

function validateSignupForm(email: string, password: string, name: string) {
  return validateRequired(email) && validateRequired(password) && validateRequired(name);
}
```

**適用範囲**:
- 3行以上の同一ロジックは共通化
- 類似の処理パターンは抽象化
- 設定値・定数は一箇所で管理

---

## 🧪 テスト関連ルール

### Rule 4: 新機能のテストケース必須
```typescript
// 新しいロジック実装例
export class OperationSemanticAnalyzer {
  analyzeUserIntent(operations: TriggerAction[]): UserIntent {
    // 新しいロジック
  }
}

// 対応するテストケース（必須）
describe('OperationSemanticAnalyzer', () => {
  describe('analyzeUserIntent', () => {
    it('ログインパターンを正しく検出する', () => {
      // テスト実装
    });
  });
});
```

**適用基準**:
- 新しいメソッド・関数には必ずテストケースを作成
- 分岐処理がある場合は全パターンをテスト
- エラーケースも含めて網羅的にテスト

---

### Rule 5: テストケース名の日本語化
```typescript
// ✅ 正しい例
describe('ユーザー認証サービス', () => {
  describe('ログイン機能', () => {
    it('有効な認証情報でログインが成功する', () => {});
    it('無効なメールアドレスでログインが失敗する', () => {});
    it('無効なパスワードでログインが失敗する', () => {});
    it('空の入力値でバリデーションエラーが発生する', () => {});
  });
});

// ❌ 悪い例
describe('AuthService', () => {
  it('should login successfully', () => {});
  it('should fail with invalid email', () => {});
});
```

**命名規則**:
- `describe`: 「〜サービス」「〜機能」「〜コンポーネント」
- `it`: 「〜する」「〜が発生する」「〜を返す」

---

### Rule 6: React Testing Library の使用
```typescript
// ✅ 正しい例
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('ログインボタンをクリックするとログイン処理が実行される', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  const loginButton = screen.getByRole('button', { name: 'ログイン' });
  await user.click(loginButton);
  
  expect(mockLoginFunction).toHaveBeenCalled();
});

// ❌ 悪い例: DOM直接操作
it('should call login function', () => {
  const { container } = render(<LoginForm />);
  const button = container.querySelector('button');
  button?.click();
});
```

**使用必須メソッド**:
- `getByRole()`, `getByLabelText()`, `getByText()`
- `userEvent.click()`, `userEvent.type()`
- `waitFor()`, `findBy*()`

---

### Rule 7: アクセシビリティ重視のテスト
```typescript
// ✅ 正しい例: アクセシビリティを活用
it('フォーム送信ボタンが適切にラベル付けされている', () => {
  render(<ContactForm />);
  
  const submitButton = screen.getByRole('button', { name: '送信' });
  const emailInput = screen.getByLabelText('メールアドレス');
  const messageInput = screen.getByLabelText('メッセージ');
  
  expect(submitButton).toBeInTheDocument();
  expect(emailInput).toBeRequired();
  expect(messageInput).toBeRequired();
});

// ❌ 悪い例: data-testid に依存
it('should render form elements', () => {
  render(<ContactForm />);
  
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  expect(screen.getByTestId('email-input')).toBeInTheDocument();
});
```

**優先順位**:
1. `getByRole()` - 最優先
2. `getByLabelText()` - フォーム要素
3. `getByText()` - テキストコンテンツ
4. `getByTestId()` - 最後の手段のみ

---

### Rule 8: テストロジックの最小化
```typescript
// ✅ 正しい例: シンプルなテスト
it('ユーザーリストが正しく表示される', () => {
  const users = [
    { id: 1, name: '田中太郎' },
    { id: 2, name: '佐藤花子' }
  ];
  
  render(<UserList users={users} />);
  
  expect(screen.getByText('田中太郎')).toBeInTheDocument();
  expect(screen.getByText('佐藤花子')).toBeInTheDocument();
});

// ❌ 悪い例: テスト内でロジック実装
it('should display filtered users', () => {
  const users = getAllUsers();
  const filteredUsers = users.filter(user => user.active); // ❌ テスト内ロジック
  
  render(<UserList users={filteredUsers} />);
  
  filteredUsers.forEach(user => { // ❌ テスト内ループ
    expect(screen.getByText(user.name)).toBeInTheDocument();
  });
});
```

**テストロジックが必要な場合**:
```typescript
// テストヘルパー関数を作成し、そのヘルパー関数もテスト
function createTestUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `テストユーザー${i + 1}`
  }));
}

// ヘルパー関数のテスト
describe('createTestUsers', () => {
  it('指定した数のテストユーザーを生成する', () => {
    const users = createTestUsers(3);
    expect(users).toHaveLength(3);
    expect(users[0].name).toBe('テストユーザー1');
  });
});
```

---

## 📋 ルール適用チェックリスト

各タスク完了時に以下をチェック：

### 品質チェック
- [ ] `npm run check-types` が通る
- [ ] `npm run lint` が通る  
- [ ] `npm run test` が通る
- [ ] 全ファイルが600行以下
- [ ] 重複コードが存在しない

### テスト品質
- [ ] 新機能にテストケースがある
- [ ] テストケース名が日本語
- [ ] React Testing Library を使用
- [ ] アクセシビリティを重視
- [ ] テスト内ロジックが最小限

### コード品質
- [ ] TypeScript型定義が適切
- [ ] ESLintルールに準拠
- [ ] 適切なコメント・JSDoc
- [ ] 命名規則に準拠

---

## 🔄 ルール更新履歴

### Version 1.0 (2024-12-22)
- 初版作成
- 基本的な品質保証ルール定義
- テスト関連ルール定義

### 今後の更新予定
- パフォーマンス関連ルール
- セキュリティ関連ルール
- アクセシビリティ関連ルール

---

## ⚠️ 重要事項

1. **例外なし**: これらのルールに例外は認められません
2. **継続的改善**: ルールは定期的に見直し・更新されます
3. **チーム責任**: 全メンバーがルール遵守の責任を負います
4. **品質優先**: 速度よりも品質を優先します

**このルールに従うことで、TestPilotプロジェクトの品質と保守性を最高水準に保ちます。**
