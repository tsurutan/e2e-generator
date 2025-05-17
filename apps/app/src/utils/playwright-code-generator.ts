/**
 * シナリオからPlaywrightのテストコードを生成する
 * @param url 対象のURL
 * @param title シナリオのタイトル
 * @param given 前提条件
 * @param when 実行するアクション
 * @param then 期待される結果
 * @returns 生成されたPlaywrightのテストコード
 */
export function generatePlaywrightCode(
  url: string,
  title: string,
  given: string,
  when: string,
  then: string
): string {
  // ファイル名を生成（タイトルをスネークケースに変換）
  const fileName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  // テストコードを生成
  const code = `
import { test, expect } from '@playwright/test';

/**
 * ${title}
 * 
 * Given: ${given}
 * When: ${when}
 * Then: ${then}
 */
test('${title}', async ({ page }) => {
  // Given: ${given}
  await page.goto('${url}');
  
  // ページが読み込まれるのを待つ
  await page.waitForLoadState('domcontentloaded');
  
  // When: ${when}
  // TODO: シナリオに基づいてアクションを実装
  // 例: await page.click('button.login');
  // 例: await page.fill('input[name="username"]', 'testuser');
  
  // Then: ${then}
  // TODO: シナリオに基づいて検証を実装
  // 例: await expect(page.locator('.success-message')).toBeVisible();
});
`;

  return code;
}
