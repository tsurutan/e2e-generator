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

### Rule 9: API開発にはtRPCを使用

```typescript
// ✅ 正しい例: tRPCルーターの実装
import { Inject } from '@nestjs/common';
import { Input, Mutation, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import { CreateUiStateRequestSchema, UiStateBaseSchema } from '@repo/shared-types';

@Router()
export class UiStatesRouter {
  constructor(@Inject(UiStatesService) private readonly service: UiStatesService) {}

  @Query({
    output: z.array(UiStateBaseSchema),
  })
  async findAll(): Promise<UiState[]> {
    return await this.service.findAll();
  }

  @Mutation({
    input: CreateUiStateRequestSchema,
    output: UiStateBaseSchema,
  })
  async create(
    @Input('title') title: string,
    @Input('description') description: string,
    @Input('pageUrl') pageUrl: string,
    @Input('projectId') projectId: string
  ): Promise<UiState> {
    return await this.service.create({ title, description, pageUrl, projectId });
  }
}

// ❌ 悪い例: REST APIコントローラー
@Controller('ui-states')
export class UiStatesController {
  @Get()
  async findAll() {
    // REST APIは使用しない
  }
}
```

**tRPC使用の利点**:
- **型安全性**: フロントエンドとバックエンドで型が自動共有
- **開発効率**: APIスキーマの手動定義が不要
- **保守性**: 型変更時の影響範囲が明確
- **バリデーション**: Zodスキーマによる自動入力検証

**必須要件**:
- 新しいAPI作成時は必ずtRPCを使用
- 共通型パッケージ（`@repo/shared-types`）のスキーマを活用
- RESTful APIは特別な理由がない限り作成禁止
- 既存のRESTエンドポイントは段階的にtRPCに移行

**スキーマ定義**:
```typescript
// 共通パッケージのスキーマを使用
import { CreateUserRequestSchema, UserResponseSchema } from '@repo/shared-types';

@Mutation({
  input: CreateUserRequestSchema,  // 共通スキーマ使用
  output: UserResponseSchema,      // 共通スキーマ使用
})
async createUser(@Input() userData: CreateUserRequest): Promise<UserResponse> {
  return await this.userService.create(userData);
}
```

---

## 📋 ルール適用チェックリスト

### 実装開始前（Rule 10準拠）
- [ ] **テスト設計**: テストケースが全て定義済み（it.todoでも可）
- [ ] **テストファイル**: 正常系・異常系・境界値を網羅
- [ ] **型定義確認**: Prisma型・共通型の再利用を確認
- [ ] **技術選択**: tRPC・共通パッケージの使用を確認
- [ ] **依存関係**: 前提タスクと影響範囲を確認
- [ ] 要件が明確に定義されている
- [ ] 設計方針が決まっている

### 実装完了時（Rule 11準拠）
- [ ] **品質チェック**: 全テスト・型チェック・Lint・ビルドが通る
- [ ] **設計原則**: DRY原則・単一責任・600行以下を遵守
- [ ] **規約遵守**: 技術選択・命名・共通パッケージ活用
- [ ] **ドキュメント**: 必要に応じて更新済み

### テストファースト（Rule 12準拠）
- [ ] **実装前**: テストファイル作成済み
- [ ] **テスト網羅**: 正常系・異常系・境界値・統合テスト
- [ ] **テスト品質**: 日本語名・1テスト1検証・ロジック最小限
- [ ] **TDD実践**: Red→Green→Refactorサイクル

### API開発（Rule 9準拠）
- [ ] 新しいAPIはtRPCで実装
- [ ] 共通型パッケージのスキーマを使用
- [ ] 適切な入力バリデーション
- [ ] 型安全性が保たれている

### タスク完了時の対応
- [ ] 対応するタスクファイルのチェックボックスを更新
- [ ] 完了したタスクの進捗状況をファイルに反映
- [ ] 関連ドキュメントの更新（必要に応じて）
- [ ] 完了基準の全項目がチェック済みであることを確認
- [ ] 次のタスクへの依存関係を確認

---

### Rule 10: 実装開始前の必須チェック

```markdown
以下を全て確認してから実装を開始する：

1. **テスト設計完了**
   - [ ] テストケースが全て定義済み
   - [ ] テストファイルが作成済み（it.todoでも可）
   - [ ] 正常系・異常系・境界値テストを網羅

2. **型定義確認**
   - [ ] Prismaで自動生成される型が使用できないか確認
   - [ ] 既存の共通型パッケージに同様の型がないか確認
   - [ ] 新しい型は共通パッケージに追加するか検討
   - [ ] 手動型定義は最小限に抑制

3. **技術選択確認**
   - [ ] API: tRPCを使用（特別な理由がない限り）
   - [ ] 型: Prisma自動生成型を優先
   - [ ] 共通機能: 共通パッケージを活用
   - [ ] スタイリング: TailwindCSS + shadcn/ui

4. **依存関係確認**
   - [ ] 前提タスクの完了状況
   - [ ] 影響範囲の把握
   - [ ] 関連ドキュメントの確認
```

**テストテンプレート例**:
```typescript
// ✅ 実装前に必ず作成
describe('ServiceName', () => {
  // TODO: 実装前に全テストケースを定義
  it.todo('正常系: 基本機能が動作する');
  it.todo('異常系: 不正な入力でエラーが発生する');
  it.todo('境界値: エッジケースが適切に処理される');

  // 実装後にit.todoをitに変更
});
```

---

### Rule 11: コード完成時の必須チェック

```markdown
実装完了時に以下を全て確認：

1. **品質チェック**
   - [ ] 全テストが通る（npm run test）
   - [ ] TypeScript型チェックが通る（npm run check-types）
   - [ ] Lintチェックが通る（npm run lint）
   - [ ] ビルドが成功する（npm run build）

2. **設計原則チェック**
   - [ ] DRY原則に従っている（重複コードなし）
   - [ ] 単一責任原則に従っている
   - [ ] 適切な抽象化レベル
   - [ ] 600行以下のファイルサイズ

3. **規約遵守チェック**
   - [ ] 技術選択ルールに従っている
   - [ ] 命名規則に従っている
   - [ ] コメント・JSDocが適切
   - [ ] 共通パッケージを活用している

4. **ドキュメント更新**
   - [ ] README.mdの更新（必要に応じて）
   - [ ] SPECIFICATION.mdの更新（仕様変更時）
   - [ ] APIドキュメントの更新（API変更時）
   - [ ] タスクファイルのチェックボックス更新
```

**重要**: これらのチェックを怠ると品質低下とプロジェクト遅延の原因となります。

---

### Rule 12: テストファースト開発の強制

```markdown
**必須**: 実装前に必ずテストを作成する

1. **テスト作成タイミング**
   - [ ] 実装開始前にテストファイルを作成
   - [ ] it.todoで全テストケースを定義
   - [ ] テストが失敗することを確認（Red）

2. **実装フロー**
   ```
   1. テストケース定義（it.todo）
   2. 最小限の実装でテスト通過（Green）
   3. リファクタリング（Refactor）
   4. 次のテストケースへ
   ```

3. **テスト網羅性**
   - [ ] 正常系: 期待される動作
   - [ ] 異常系: エラーハンドリング
   - [ ] 境界値: エッジケース
   - [ ] 統合: 他コンポーネントとの連携

4. **テスト品質**
   - [ ] テスト名は日本語で分かりやすく
   - [ ] 1テスト1検証項目
   - [ ] テスト内にロジックを含めない
   - [ ] モックは最小限に抑制
```

**例外**: テストが技術的に困難な場合は、理由を明記してレビューで承認を得る

---

## 📋 タスク完了チェック手順

### 必須チェック項目
各タスク完了時に以下を必ず実行：

1. **実装内容の全項目チェック**
   ```markdown
   - [x] 実装項目1
   - [x] 実装項目2
   - [x] 実装項目3
   ```

2. **検証方法の全項目チェック**
   ```markdown
   - [x] 検証項目1
   - [x] 検証項目2
   - [x] 検証項目3
   ```

3. **完了基準の全項目チェック**
   ```markdown
   - [x] 完了基準1
   - [x] 完了基準2
   - [x] 完了基準3
   ```

### チェック漏れ防止策
- タスクファイル内で `[ ]` を検索し、未完了項目がないことを確認
- 関連するPhaseの完了基準も同時にチェック
- 次のタスクの前提条件が満たされていることを確認

### 重要な注意事項
⚠️ **チェック漏れは品質低下とプロジェクト遅延の原因となります**
- 全ての項目を確実にチェックしてください
- 不明な点があれば必ず確認してから進めてください
- 完了していない項目は正直に未完了のままにしてください

---

## 🔄 ルール更新履歴

### Version 1.0 (2024-12-22)
- 初版作成
- 基本的な品質保証ルール定義
- テスト関連ルール定義

### Version 1.1 (2025-06-22)
- Rule 9追加: API開発にはtRPCを使用
- 共通型パッケージの活用を明文化
- APIチェックリスト項目を追加

### Version 1.2 (2025-06-22)
- Rule 10追加: 実装開始前の必須チェック
- Rule 11追加: コード完成時の必須チェック
- Rule 12追加: テストファースト開発の強制
- チェックリストの大幅改善
- 品質問題の根本的解決策を追加

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
