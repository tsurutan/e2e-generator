import { ScenarioDto } from '../dto';
import { LabelDto } from '../../labels/dto/label.dto';

/**
 * シナリオとラベル情報からPlaywrightのテストコードを生成する
 * @param scenario シナリオ情報
 * @param labels 関連するラベル情報
 * @param projectUrl プロジェクトのURL
 * @returns 生成されたPlaywrightのテストコード
 */
export function generatePlaywrightCode(
  scenario: ScenarioDto,
  labels: LabelDto[] = [],
  projectUrl: string = 'https://example.com',
): string {
  // ファイル名を生成（タイトルをスネークケースに変換）
  const fileName = scenario.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  // ラベル情報からセレクタを抽出
  const labelSelectors = labels.map(label => {
    return {
      name: label.name,
      selector: label.selector,
      description: label.description || '',
    };
  });

  // セレクタの変数名を生成
  const selectorVariables = labelSelectors.map(label => {
    const varName = label.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    return `const ${varName}Selector = '${label.selector}'; // ${label.description}`;
  }).join('\n  ');

  // Given, When, Thenからアクションを抽出
  const givenActions = extractActionsFromGherkin(scenario.given, labelSelectors);
  const whenActions = extractActionsFromGherkin(scenario.when, labelSelectors);
  const thenAssertions = extractAssertionsFromGherkin(scenario.then, labelSelectors);

  // テストコードを生成
  const code = `// @ts-check
import { test, expect } from '@playwright/test';

/**
 * ${scenario.title}
 *
 * ${scenario.description ? scenario.description + '\n * \n * ' : ''}
 * Given: ${scenario.given}
 * When: ${scenario.when}
 * Then: ${scenario.then}
 */
test('${scenario.title}', async ({ page }) => {
  // セレクタの定義
  ${selectorVariables ? selectorVariables : '  // ラベル付けされた要素はありません'}

  // Given: ${scenario.given}
  await page.goto('${projectUrl}');
  await page.waitForLoadState('domcontentloaded');
  ${givenActions ? '\n  ' + givenActions.join('\n  ') : '  // 前提条件のアクションはありません'}

  // When: ${scenario.when}
  ${whenActions ? whenActions.join('\n  ') : '  // TODO: シナリオに基づいてアクションを実装してください\n  // 例: await page.click(\'button.login\');'}

  // Then: ${scenario.then}
  ${thenAssertions ? thenAssertions.join('\n  ') : '  // TODO: シナリオに基づいて検証を実装してください\n  // 例: await expect(page.locator(\'.success-message\')).toBeVisible();'}
});
`;

  return code;
}

/**
 * Gherkin文からアクションを抽出する
 * @param gherkinText Gherkinテキスト
 * @param labelSelectors ラベルセレクタ情報
 * @returns 抽出されたアクション
 */
function extractActionsFromGherkin(
  gherkinText: string,
  labelSelectors: { name: string; selector: string; description: string }[],
): string[] {
  const actions: string[] = [];
  const lowerText = gherkinText.toLowerCase();

  // クリックアクションの検出
  for (const label of labelSelectors) {
    const lowerLabelName = label.name.toLowerCase();
    if (lowerText.includes(`クリック`) && lowerText.includes(lowerLabelName)) {
      const varName = label.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      actions.push(`await page.click(${varName}Selector);`);
    }
  }

  // 入力アクションの検出
  const inputMatches = lowerText.match(/「(.+?)」を(.+?)に入力/g);
  if (inputMatches) {
    for (const match of inputMatches) {
      const valueMatch = match.match(/「(.+?)」/);
      const fieldMatch = match.match(/を(.+?)に入力/);
      if (valueMatch && fieldMatch) {
        const value = valueMatch[1];
        const fieldName = fieldMatch[1];

        // ラベルとフィールド名のマッチング
        for (const label of labelSelectors) {
          const lowerLabelName = label.name.toLowerCase();
          if (lowerLabelName.includes(fieldName)) {
            const varName = label.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_|_$/g, '');
            actions.push(`await page.fill(${varName}Selector, '${value}');`);
            break;
          }
        }
      }
    }
  }

  // 基本的なアクションが検出されなかった場合のデフォルトアクション
  if (actions.length === 0) {
    if (lowerText.includes('ログイン')) {
      actions.push(`// ログインアクション`);
      actions.push(`// await page.fill('input[name="username"]', 'testuser');`);
      actions.push(`// await page.fill('input[name="password"]', 'password');`);
      actions.push(`// await page.click('button[type="submit"]');`);
    } else if (lowerText.includes('フォーム')) {
      actions.push(`// フォーム入力アクション`);
      actions.push(`// await page.fill('input[name="field1"]', 'value1');`);
      actions.push(`// await page.click('button[type="submit"]');`);
    } else if (lowerText.includes('ボタン')) {
      actions.push(`// ボタンクリックアクション`);
      actions.push(`// await page.click('button:has-text("実行")');`);
    } else {
      actions.push(`// TODO: "${gherkinText}" に基づいたアクションを実装してください`);
    }
  }

  return actions;
}

/**
 * Gherkin文から検証を抽出する
 * @param gherkinText Gherkinテキスト
 * @param labelSelectors ラベルセレクタ情報
 * @returns 抽出された検証
 */
function extractAssertionsFromGherkin(
  gherkinText: string,
  labelSelectors: { name: string; selector: string; description: string }[],
): string[] {
  const assertions: string[] = [];
  const lowerText = gherkinText.toLowerCase();

  // 表示の検証
  for (const label of labelSelectors) {
    const lowerLabelName = label.name.toLowerCase();
    if (lowerText.includes(`表示`) && lowerText.includes(lowerLabelName)) {
      const varName = label.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      assertions.push(`await expect(page.locator(${varName}Selector)).toBeVisible();`);
    }
  }

  // テキスト内容の検証
  const textMatches = lowerText.match(/「(.+?)」というテキスト/g);
  if (textMatches) {
    for (const match of textMatches) {
      const textMatch = match.match(/「(.+?)」/);
      if (textMatch) {
        const text = textMatch[1];
        assertions.push(`await expect(page.locator('text="${text}"')).toBeVisible();`);
      }
    }
  }

  // URLの検証
  if (lowerText.includes('url') || lowerText.includes('ページ')) {
    if (lowerText.includes('リダイレクト') || lowerText.includes('遷移')) {
      assertions.push(`// URLの検証`);
      assertions.push(`await expect(page).toHaveURL(/.*expected-path.*/);`);
    }
  }

  // 基本的な検証が検出されなかった場合のデフォルト検証
  if (assertions.length === 0) {
    if (lowerText.includes('成功')) {
      assertions.push(`// 成功メッセージの検証`);
      assertions.push(`await expect(page.locator('.success-message')).toBeVisible();`);
    } else if (lowerText.includes('エラー')) {
      assertions.push(`// エラーメッセージの検証`);
      assertions.push(`await expect(page.locator('.error-message')).toBeVisible();`);
    } else {
      assertions.push(`// TODO: "${gherkinText}" に基づいた検証を実装してください`);
    }
  }

  return assertions;
}
