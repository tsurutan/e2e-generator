// @ts-check
import { test, expect } from '@playwright/test';

/**
 * 登録情報の編集
 *
 * ユーザーが登録情報を編集する。
 * 
 * 
 * Given: ユーザーがログイン状態でマイページにアクセスしている。
 * When: ユーザーが登録情報編集ページにアクセスし、情報を更新して保存ボタンをクリックする。
 * Then: ユーザーの登録情報が更新され、更新成功のメッセージが表示される。
 */
test('登録情報の編集', async ({ page }) => {
  // セレクタの定義
  const Selector = 'textarea#APjFqb.gLFyf.'; // 

  // Given: ユーザーがログイン状態でマイページにアクセスしている。
  await page.goto('https://www.google.com');
  await page.waitForLoadState('domcontentloaded');
  
  // ログインアクション
  // await page.fill('input[name="username"]', 'testuser');
  // await page.fill('input[name="password"]', 'password');
  // await page.click('button[type="submit"]');

  // When: ユーザーが登録情報編集ページにアクセスし、情報を更新して保存ボタンをクリックする。
  // ボタンクリックアクション
  // await page.click('button:has-text("実行")');

  // Then: ユーザーの登録情報が更新され、更新成功のメッセージが表示される。
  // 成功メッセージの検証
  await expect(page.locator('.success-message')).toBeVisible();
});
