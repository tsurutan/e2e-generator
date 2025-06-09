import {tool} from '@langchain/core/tools';
import {ChatGoogleGenerativeAI} from '@langchain/google-genai';
import {ToolException} from '@langchain/mcp-adapters/dist/tools';
import {createReferenceTools} from 'src/llm-utils';
import {PrismaService} from 'src/prisma/prisma.service';
import {z} from 'zod';
import {ScenarioDto} from '../dto';
import {LabelDto} from '../../labels/dto/label.dto';
import {ChatOpenAI} from '@langchain/openai';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {Logger} from '@nestjs/common';
import {MultiServerMCPClient} from '@langchain/mcp-adapters';
import {BaseMessage, HumanMessage, ToolMessage} from '@langchain/core/messages';

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
    prisma: PrismaService,
    projectId: string,
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
        const llm = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.0-flash",
            temperature: 0,
        });

        // MCP クライアントの初期化
        const mcpClient = new MultiServerMCPClient({
            playwright: {
                command: 'npx',
                args: ['@playwright/mcp@latest', '--headless'],
            },
        });

        // 構造化出力を使用せず、テキスト出力を直接取得する

        // プロンプトテンプレートの作成
        const systemPrompt = `あなたはPlaywrightのテストコードを生成する専門家です。
与えられたシナリオとラベル情報から、Playwrightを使用したテストコードを生成してください。

あなたはMicrosoft Playwright Test Runner (MCP)ツールを使用して、高品質なテストコードを生成します。
MCPツールを使用することで、より堅牢で信頼性の高いテストコードを生成できます。

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
- MCPが提供する機能を活用して、より堅牢なテストを作成すること

コードは以下の構造を持つ必要があります：
1. ファイルの先頭にコメントとimport文
2. シナリオのタイトルと説明を含むJSDocコメント
3. test関数の呼び出し
4. セレクタ変数の定義
5. Given、When、Thenの各ステップに対応するコード

ラベル情報を最大限に活用し、シナリオの内容に基づいて適切なアクションと検証を実装してください。

MCPが提供する以下の機能を活用してください：
- 要素の可視性や存在の確認
- 適切なタイミングでの待機処理
- 堅牢なセレクタの使用
- エラーハンドリング
- テスト実行の安定性向上のためのベストプラクティス
ログインに必要な情報は
email: tsurutan.android@gmail.com
password: Sample1234
です
またgetPages, getLabelsを使用して必要な情報を取得し、それらをもとにコードを作成してください。
`;

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
        // MCPツールを取得
        const tools = await mcpClient.getTools('playwright');

        // MCPツールを使用してLLMを拡張
        const llmWithTools = llm.bind({
            tools: [...createReferenceTools(prisma, projectId), ...tools],
        });

        logger.log(`シナリオ「${scenario.title}」のPlaywrightコード生成を開始します（MCPツール使用）`);
        const messages: BaseMessage[] = prompt.messages;
        let aiMessage = await llmWithTools.invoke(messages);
        let count = 0;
        while (true) {
            for (const toolCall of aiMessage.tool_calls) {
                const selectedTool = tools.find(tool => tool.name === toolCall.name);
                if (selectedTool) {
                    console.dir(toolCall)
                    try {
                        // @ts-ignore
                        const result = await selectedTool.invoke(toolCall);
                        messages.push(result);
                    } catch (e) {
                        console.log(`error = ${e}, handling...`);
                        messages.push(new ToolMessage({
                            tool_call_id: toolCall.id,
                            name: toolCall.name,
                            content: e.message,
                        }));
                        messages.push(new HumanMessage({
                            content: 'The last tool call raised an exception. Try calling the tool again with corrected arguments. Do not repeat mistakes.'
                        }))
                    }
                }
            }
            aiMessage = await llmWithTools.invoke(messages);
            messages.push(aiMessage);
            if (aiMessage.tool_calls.length === 0) {
                break;
            }
            count++;
            console.log(`count = ${count}`)
        }


        const responseText = messages[messages.length - 1].content as string;
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




