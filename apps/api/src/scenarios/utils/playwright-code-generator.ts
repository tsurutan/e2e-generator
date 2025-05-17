import { ScenarioDto } from '../dto';
import { LabelDto } from '../../labels/dto/label.dto';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Logger } from '@nestjs/common';

// ロガーの初期化
const logger = new Logger('PlaywrightCodeGenerator');

/**
 * シナリオとラベル情報からPlaywrightのテストコードを生成する
 * @param scenario シナリオ情報
 * @param labels 関連するラベル情報
 * @param projectUrl プロジェクトのURL
 * @returns 生成されたPlaywrightのテストコード
 */
export async function generatePlaywrightCode(
  scenario: ScenarioDto,
  labels: LabelDto[] = [],
  projectUrl: string = 'https://example.com',
): Promise<string> {
  try {
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

    // OpenAI APIの初期化
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o',
      temperature: 0.2,
    });

    // 構造化出力を使用せず、テキスト出力を直接取得する

    // プロンプトテンプレートの作成
    const systemPrompt = `あなたはPlaywrightのテストコードを生成する専門家です。
与えられたシナリオとラベル情報から、Playwrightを使用したテストコードを生成してください。

以下の情報が提供されます：
1. シナリオ情報（タイトル、説明、Given、When、Then）
2. ラベル情報（名前、セレクタ、説明）
3. プロジェクトのURL

生成するコードは以下の要件を満たす必要があります：
- TypeScriptで記述すること
- Playwrightのtest関数とexpect関数を使用すること
- セレクタ変数を定義し、ラベル情報を活用すること
- Given、When、Thenの各ステップに対応するコードを生成すること
- コードにはコメントを含め、理解しやすくすること
- 実行可能な完全なテストコードを生成すること

コードは以下の構造を持つ必要があります：
1. ファイルの先頭にコメントとimport文
2. シナリオのタイトルと説明を含むJSDocコメント
3. test関数の呼び出し
4. セレクタ変数の定義
5. Given、When、Thenの各ステップに対応するコード

ラベル情報を最大限に活用し、シナリオの内容に基づいて適切なアクションと検証を実装してください。`;

    const humanPrompt = `シナリオ情報：
タイトル: {title}
説明: {description}
Given: {given}
When: {when}
Then: {then}

プロジェクトURL: {projectUrl}

ラベル情報：
{labelInfo}

この情報を使用して、Playwrightのテストコードを生成してください。`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', humanPrompt]
    ]);

    // ラベル情報を文字列に変換
    const labelInfo = labelSelectors.length > 0
      ? labelSelectors.map(label => `名前: ${label.name}\nセレクタ: ${label.selector}\n説明: ${label.description}`).join('\n\n')
      : 'ラベル情報はありません';

    // プロンプトの作成と実行
    const prompt = await promptTemplate.invoke({
      title: scenario.title,
      description: scenario.description || '説明なし',
      given: scenario.given,
      when: scenario.when,
      then: scenario.then,
      projectUrl,
      labelInfo,
    });

    logger.log(`シナリオ「${scenario.title}」のPlaywrightコード生成を開始します`);

    // LLMの呼び出し
    const result = await llm.invoke(prompt);

    logger.log(`シナリオ「${scenario.title}」のPlaywrightコード生成が完了しました`);

    // レスポンスの構造をログに出力
    logger.log(`レスポンスの構造: ${JSON.stringify(Object.keys(result))}`);

    // レスポンスからテキストを取得
    let responseText = '';
    if (typeof result === 'string') {
      responseText = result;
    } else if (result.content) {
      responseText = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    } else if (result.text) {
      responseText = result.text;
    } else if ("value" in result && result.text) {
      responseText = typeof result.value === 'string' ? result.value : JSON.stringify(result.value);
    } else {
      // その他の場合はオブジェクト全体を文字列化
      responseText = JSON.stringify(result);
    }

    // 生成されたコードを抽出
    const codeMatch = responseText.match(/```(?:typescript|js)?([\s\S]*?)```/);
    if (!codeMatch || !codeMatch[1]) {
      // コードブロックが見つからない場合は、レスポンス全体をコードとして扱う
      logger.warn('コードブロックが見つかりませんでした。レスポンス全体を使用します。');
      return responseText;
    }

    return codeMatch[1].trim();
  } catch (error) {
    logger.error(`Playwrightコード生成中にエラーが発生しました: ${error.message}`, error.stack);

    // エラーを再スローして上位層で処理できるようにする
    throw new Error(`Playwrightコードの生成に失敗しました: ${error.message}`);
  }
}




