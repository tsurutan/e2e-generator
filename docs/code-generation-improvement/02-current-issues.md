# 現在の課題分析

## 具体的な問題事例

### ログインフローの問題
ルートページ（`/`）からログイン後のページへ遷移する場合の典型的なフロー：

1. ルートページ内のログインボタンをクリック
2. 表示されたモーダル内でメールアドレス・パスワードタブをクリック
3. メールアドレス・パスワードを入力
4. ログインボタンを押下

### 現在の生成コードの問題

```typescript
// 現在生成されるコード（問題あり）
test('ログインテスト', async ({ page }) => {
  await page.goto('https://example.com');
  
  // 問題1: モーダルの表示を待機していない
  await page.click('button.login');
  
  // 問題2: 要素が表示されるまでの待機が不十分
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  
  // 問題3: フォーム送信後の遷移を考慮していない
  await page.click('button[type="submit"]');
});
```

### 実際に必要なコード

```typescript
// 改善されたコード
test('ログインテスト', async ({ page }) => {
  await page.goto('https://example.com');
  
  // ログインボタンをクリック
  await page.click('button.login');
  
  // モーダルの表示を待機
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  
  // タブ切り替えが必要な場合
  await page.click('button[data-tab="email-password"]');
  
  // フォーム入力（要素の可視性を確認）
  await page.waitForSelector('input[name="email"]', { state: 'visible' });
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  
  // フォーム送信と遷移の待機
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);
  
  // ログイン成功の確認
  await expect(page.locator('.dashboard')).toBeVisible();
});
```

## 技術的課題の詳細

### 1. 静的解析の限界

#### 現在の実装
```typescript
// apps/api/src/scenarios/scenarios.service.ts (353-357行目)
let labels = projectId
    ? await this.prisma.label.findMany({
        where: {projectId},
    })
    : [];
```

#### 問題点
- 初回レンダー時のHTML構造のみを考慮
- 動的に表示される要素の情報が不足
- 操作による状態変化が記録されていない

### 2. DOM変更追跡の不足

#### 現在の実装
```typescript
// apps/app/src/renderer/pages/BrowserPage.tsx (269-285行目)
const observer = new MutationObserver(function (mutations) {
  for (const mutation of mutations) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log("[MUTATION]", node.innerHTML);
        }
      });
    }
  }
});
```

#### 問題点
- 基本的なDOM変更のみを記録
- before/after状態の詳細な差分が不足
- 操作との関連性が記録されていない

### 3. 操作フローの分断

#### 現在の実装
```typescript
// apps/app/src/renderer/pages/BrowserPage.tsx (340-355行目)
function recordUserAction(type, element, additionalData = {}) {
  const actionData = {
    type,
    selector,
    text,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  console.log('[EVENT] USER_ACTION:' + JSON.stringify(actionData));
}
```

#### 問題点
- 個別の操作として記録される
- 関連する操作のグループ化がない
- ユーザーの意図や目標が考慮されない

### 4. コンテキスト情報の不足

#### 現在のプロンプト
```typescript
// apps/api/src/scenarios/utils/playwright-code-generator.ts (67-121行目)
const systemPrompt = `あなたはPlaywrightのテストコードを生成する専門家です。
与えられたシナリオとラベル情報から、Playwrightを使用したテストコードを生成してください。
...
ラベル情報を最大限に活用し、シナリオの内容に基づいて適切なアクションと検証を実装してください。`;
```

#### 問題点
- 静的なラベル情報のみ
- UI状態変遷の情報が不足
- 操作フローや意図の情報がない

## パフォーマンス課題

### 1. タイムアウトエラーの頻発

#### 実際のエラー例
```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')
```

#### 原因
- 動的要素の表示タイミングを考慮していない
- 適切な待機戦略が不足
- ネットワーク遅延やアニメーションを考慮していない

### 2. セレクタの脆弱性

#### 問題のあるセレクタ例
```typescript
// 脆弱なセレクタ
await page.click('div > div:nth-child(3) > button');

// 動的に変化するクラス名
await page.click('.css-1a2b3c4');
```

#### 改善されたセレクタ例
```typescript
// 堅牢なセレクタ
await page.click('[data-testid="login-button"]');
await page.getByRole('button', { name: 'ログイン' });

// フォールバック戦略
const loginButton = page.locator('[data-testid="login-button"]')
  .or(page.getByRole('button', { name: 'ログイン' }))
  .or(page.locator('button.login-btn'));
```

## ユーザビリティ課題

### 1. 手動修正の頻度

#### 統計データ
- 生成されたコードの約50%で手動修正が必要
- 主な修正内容：
  - 待機処理の追加（40%）
  - セレクタの修正（30%）
  - エラーハンドリングの追加（20%）
  - その他（10%）

### 2. エラーメッセージの不明確さ

#### 現在のエラー処理
```typescript
// apps/api/src/scenarios/scenarios.service.ts (497行目)
const result = await this.llm.invoke(prompt);
```

#### 問題点
- LLMからのエラー情報が不十分
- デバッグ情報の不足
- 改善提案の不足

## データモデルの制約

### 1. UIStateモデルの限界

#### 現在のスキーマ
```prisma
model UiState {
  id          String   @id @default(uuid())
  title       String
  description String
  pageUrl     String
  projectId   String
  html        String?
  // ...
}
```

#### 不足している情報
- セッション情報
- 操作トリガー情報
- DOM状態のスナップショット
- パフォーマンス指標

### 2. Labelモデルの制約

#### 現在のスキーマ
```prisma
model Label {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)
  description String?
  selector    String
  elementText String?
  // ...
}
```

#### 不足している情報
- 動的要素フラグ
- トリガーアクション情報
- 要素の位置・サイズ情報
- 可視性状態

## 改善の必要性

これらの課題により、以下の問題が発生しています：

1. **開発効率の低下**: 手動修正に時間がかかる
2. **テスト品質の低下**: 不安定なテストが生成される
3. **ユーザー体験の悪化**: 期待通りに動作しない
4. **保守性の低下**: 理解しにくいコードが生成される

次のセクションでは、これらの課題に対する具体的な解決アプローチを説明します。
