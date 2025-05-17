# Test info

- Name: 登録情報の編集
- Location: /Users/tsurutaatsushihiroshi/src/tsurutan/e2e-app/tests/scenario-804326fa-2ffc-45da-87b1-3c527421ec44.spec.js:14:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('.success-message')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('.success-message')

    at /Users/tsurutaatsushihiroshi/src/tsurutan/e2e-app/tests/scenario-804326fa-2ffc-45da-87b1-3c527421ec44.spec.js:33:50
```

# Page snapshot

```yaml
- navigation:
  - link "Gmail":
    - /url: https://mail.google.com/mail/&ogbl
  - link "画像を検索する":
    - /url: https://www.google.com/imghp?hl=ja&ogbl
    - text: 画像
  - button "Google アプリ":
    - img
  - link "ログイン":
    - /url: https://accounts.google.com/ServiceLogin?hl=ja&passive=true&continue=https://www.google.com/&ec=futura_exp_og_so_72776762_e
- img
- search:
  - img
  - combobox "検索"
  - button "音声で検索":
    - img
  - button "画像で検索":
    - img
  - button "Google 検索"
  - button "I'm Feeling Lucky"
- text: "Google 検索は次の言語でもご利用いただけます:"
- link "English":
  - /url: https://www.google.com/setprefs?sig=0_1sdoVbVNGs7yFl93kx8Kc6hnYnw%3D&hl=en&source=homepage&sa=X&ved=0ahUKEwjq25W6o6qNAxW2sVYBHalJKDQQ2ZgBCBU
- contentinfo:
  - text: 日本
  - link "Googleについて":
    - /url: https://about.google/?utm_source=google-JP&utm_medium=referral&utm_campaign=hp-footer&fg=1
  - link "広告":
    - /url: https://www.google.com/intl/ja_jp/ads/?subid=ww-ww-et-g-awa-a-g_hpafoot1_1!o2&utm_source=google.com&utm_medium=referral&utm_campaign=google_hpafooter&fg=1
  - link "ビジネス":
    - /url: https://www.google.com/services/?subid=ww-ww-et-g-awa-a-g_hpbfoot1_1!o2&utm_source=google.com&utm_medium=referral&utm_campaign=google_hpbfooter&fg=1
  - link "検索の仕組み":
    - /url: https://google.com/search/howsearchworks/?fg=1
  - link "プライバシー":
    - /url: https://policies.google.com/privacy?hl=ja&fg=1
  - link "規約":
    - /url: https://policies.google.com/terms?hl=ja&fg=1
  - button "設定"
- dialog "Google にログイン":
  - text: Google にログイン Google アカウントを最大限に活用しましょう
  - button "ログインしない"
  - button "ログイン"
```

# Test source

```ts
   1 | // @ts-check
   2 | import { test, expect } from '@playwright/test';
   3 |
   4 | /**
   5 |  * 登録情報の編集
   6 |  *
   7 |  * ユーザーが登録情報を編集する。
   8 |  * 
   9 |  * 
  10 |  * Given: ユーザーがログイン状態でマイページにアクセスしている。
  11 |  * When: ユーザーが登録情報編集ページにアクセスし、情報を更新して保存ボタンをクリックする。
  12 |  * Then: ユーザーの登録情報が更新され、更新成功のメッセージが表示される。
  13 |  */
  14 | test('登録情報の編集', async ({ page }) => {
  15 |   // セレクタの定義
  16 |   const Selector = 'textarea#APjFqb.gLFyf.'; // 
  17 |
  18 |   // Given: ユーザーがログイン状態でマイページにアクセスしている。
  19 |   await page.goto('https://www.google.com');
  20 |   await page.waitForLoadState('domcontentloaded');
  21 |   
  22 |   // ログインアクション
  23 |   // await page.fill('input[name="username"]', 'testuser');
  24 |   // await page.fill('input[name="password"]', 'password');
  25 |   // await page.click('button[type="submit"]');
  26 |
  27 |   // When: ユーザーが登録情報編集ページにアクセスし、情報を更新して保存ボタンをクリックする。
  28 |   // ボタンクリックアクション
  29 |   // await page.click('button:has-text("実行")');
  30 |
  31 |   // Then: ユーザーの登録情報が更新され、更新成功のメッセージが表示される。
  32 |   // 成功メッセージの検証
> 33 |   await expect(page.locator('.success-message')).toBeVisible();
     |                                                  ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  34 | });
  35 |
```