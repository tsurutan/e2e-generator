import {HumanMessage, ToolMessage} from '@langchain/core/messages';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {ChatGoogleGenerativeAI} from '@langchain/google-genai';
import {MultiServerMCPClient} from '@langchain/mcp-adapters';
import {ChatOpenAI} from '@langchain/openai';
import {Injectable, NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {createAllTools} from 'src/llm-utils';
import {PrismaService} from '../prisma/prisma.service';
import {Project, Prisma} from '@prisma/client';
import {CreateProjectDto} from './dto/create-project.dto';
import {UpdateProjectDto} from './dto/update-project.dto';
import {ProjectWithFeatureCount} from './dto/project-with-feature-count.dto';

@Injectable()
export class ProjectsService {
    private readonly llmOpenAI: ChatOpenAI;
    private readonly llmGoogle: ChatGoogleGenerativeAI;

    constructor(private configService: ConfigService, private prisma: PrismaService) {
        this.llmOpenAI = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
            model: 'gpt-4o',
            temperature: 0,
        });
        this.llmGoogle = new ChatGoogleGenerativeAI({
            apiKey: this.configService.get<string>('GOOGLE_API_KEY'),
            model: "gemini-2.0-flash",
            temperature: 0,
        });
    }

    async generateAllResources(projectId: string) {
        try {
            const project = await this.prisma.project.findUnique({
                where: {id: projectId},
            });

            if (!project) {
                throw new NotFoundException(`Project with ID ${projectId} not found`);
            }

            // MCP クライアントの初期化
            const mcpClient = new MultiServerMCPClient({
                playwright: {
                    command: 'npx',
                    args: ['@playwright/mcp@latest', '--headless'],
                },
            });

//             const systemPrompt = `
// 以下のURLをPlaywright-MCPでクローリングし、各ページのURLとタイトルをsavePageで保存してください。
// PageはそれぞれUIの変化に対応したUIStateを持っております。またPageはデフォルトの初期状態UIState(isDefault=true)を持っておりこの状態は各ページに必ず一つ存在します。
// ボタンを押したりなどして見た目に変化(ダイアログが表示されたりなど)があった場合に新たにUIStateを作成したいです(saveUIState)。
// またそのUIStateへどのようにして遷移したかをsaveEdgeを使用して保存してください。詳細はdescriptionに書いてください。この内容は今後Playwrightのコード生成に使用されることを前提に情報を入れてください。
// saveEdgeは遷移元と遷移先のUIStateとPageがあらかじめ保存されないと呼び出せません。
// さらに、各ページにある重要なDOM要素をname、description、selector(#id, .class, [attribute], data-*, aria-*などを使用してください, important! playwrightで取得できる情報を使用してください。htmlの構造が変わっても取得できる内容が変わらないセレクタを生成してください。(可能であれば) )、elementText付きでsaveLabel関数を使って保存してください。
// name, descriptionは日本語でお願いします。
// 存在しないurlなどを絶対に入力しないでください。
// UIStateを作成したら必ずEdgeも追加してください。(プロジェクトURLの初期UIStateは例外です)
// ただしすでに保存されているかをgetPages, getLabels, getEdges, getUIStatesで確認し、重複しないようにしてください。
// またPlaywrightでは画面全体をスクロールしてすべての要素を取得してください。要素は特にbuttonやlinkなど重要そうな要素を集中的に取得してください。
// aリンクなどで画面遷移できそうな箇所があれば積極的に画面遷移をして新しいページの要素を取得してください。
// browser_resizeはしないでください。
// 遷移先はプロジェクトULRのoriginで始まるページのみが対象です。
// またログインが必要なページがあれば下記認証情報を使用してください。
// email: tsurutan.android@gmail.com
// password: Sample1234
// です
// プロジェクトURL自体のページもクローリングの対象です。プロジェクトURLのページがなければ追加してください。
// !Important!
// 特にログインするまでのフローが重要です。ラベルやUIStateなど存在していなければ作成してください。
// プロジェクトURLの初期画面が重要です。この画面のラベルやUIStateは必ず作成してください。
// `
            const systemPrompt = `
### ✅ **LangChain System Prompt**

以下のルールに従い、Playwright-MCPを用いてWebサイトを**ステップバイステップでクローリング**してください。
このデータは今後、Playwrightコード自動生成に活用されます。

---

### 🔁 **探索の基本フロー**

1. **プロジェクトURLのページを開き、まず必ず以下を行う：**

   * \`savePage\`でページ情報（URL、タイトル）を保存。
   * 画面を最後までスクロールし、**実際に存在する要素のみ**を検出。
   * \`saveLabel\`で重要なDOM要素（ボタン、リンクなど）を保存。
   * \`saveUIState\`で初期状態（\`isDefault: true\`）を保存。

     * **このステップは非常に重要です。無視しないでください。**

2. 各ラベル（ボタン・リンク）を1つずつ操作し、UI変化を確認。

   * **視覚的変化（ダイアログ、リスト展開、ページ遷移など）を検知したら：**

     * 新しい\`UIState\`を保存
     * \`saveEdge\`で「どの要素でどんな変化があったか」を\`description\`付きで保存
   * 遷移先URLがプロジェクトのoriginであれば、新しいページとして再帰的に処理を繰り返す

---

### 🔐 **ログインフローは最重要対象です**

* ログインページのUIState、ボタンや入力欄のラベルも**丁寧に保存**してください。
* ログイン後に表示されるページの初期状態も\`saveUIState\`してください。
* ログインまでの状態遷移（入力 → ボタンクリック → ログイン成功）には**適切な\`saveEdge\`を必ず挿入**してください。

\`\`\`
email: tsurutan.android@gmail.com
password: Sample1234
\`\`\`

---

### 📌 **禁止事項と注意点**

* ❌ **存在しないラベルや要素を保存しないでください。**

  * 例：「お電話で相談」など、DOMに存在しないものは絶対に記録しないこと。
* ✅ \`getPages\`, \`getLabels\`, \`getEdges\`, \`getUIStates\`で**保存済みデータを確認し、重複登録を避けること**。
* ✅ **画面の全スクロール**を行って、すべての表示要素を検出。
* ✅ \`saveEdge\`は\`from\`と\`to\`のUIStateおよびPageが保存済みであることを前提に呼び出す。
* ❌ **browserサイズの変更（resize）は禁止**
* ✅ **同一オリジン以外のページには遷移しないこと**
            `
            const humanPrompt = `プロジェクトURL: {projectUrl}`;

            const promptTemplate = ChatPromptTemplate.fromMessages([
                ['system', systemPrompt],
                ['human', humanPrompt]
            ]);

            // プロンプトの作成と実行
            const prompt = await promptTemplate.invoke({
                projectUrl: project.url,
            });
            const messages = prompt.messages;

            const playwrightTools = await mcpClient.getTools('playwright');
            const tools = [...createAllTools(this.prisma, projectId), ...playwrightTools]
            const llmWithTools = this.llmGoogle.bind({
                tools,
            });
            console.log('start llm');
            let aiMessage = await llmWithTools.invoke(messages);
            messages.push(aiMessage);
            let count = 0;
            while (true) {
                for (const toolCall of aiMessage.tool_calls) {
                    const selectedTool = tools.find(tool => tool.name === toolCall.name);
                    if (selectedTool) {
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
            console.log('finished')
        } catch (e) {
            console.error("error = ", e);
        }
    }

    async findAll(): Promise<ProjectWithFeatureCount[]> {
        // プロジェクト一覧と各プロジェクトの機能数を一度のクエリで取得
        const projectsWithFeatureCount = await this.prisma.project.findMany({
            include: {
                _count: {
                    select: {
                        features: true
                    }
                }
            }
        });

        // 結果を ProjectWithFeatureCount インターフェースの形式に変換
        return projectsWithFeatureCount.map(project => ({
            ...project,
            featureCount: project._count.features
        }));
    }

    async findOne(id: string): Promise<Project> {
        const project = await this.prisma.project.findUnique({
            where: {id},
        });
        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }
        return project;
    }

    async create(createProjectDto: CreateProjectDto): Promise<Project> {
        return this.prisma.project.create({
            data: createProjectDto,
        });
    }

    async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
        try {
            return await this.prisma.project.update({
                where: {id},
                data: updateProjectDto,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException(`Project with ID ${id} not found`);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.prisma.project.delete({
                where: {id},
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException(`Project with ID ${id} not found`);
            }
            throw error;
        }
    }
}
