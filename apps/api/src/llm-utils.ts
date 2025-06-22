import {tool} from '@langchain/core/tools';
import {PrismaService} from 'src/prisma/prisma.service';
import {z} from 'zod';

export const createReferenceTools = (prisma: PrismaService, projectId: string) => {
    const getPages = tool(
        async () => {
            const result = await prisma.page.findMany({
                where: {projectId},
            });
            return JSON.stringify(result);
        },
        {
            name: "getPages",
            description: "保存済みのページ情報を取得します。ページは複数のUIStateを持ちます",
            schema: z.object({}),
        });
    const getLabels = tool(
        async ({url}) => {
            const result = await prisma.label.findMany({
                where: {projectId, url},
            });
            return JSON.stringify(result);
        },
        {
            name: "getLabels",
            description: "指定したURLのラベル情報を取得します",
            schema: z.object({
                url: z.string().describe("ラベルを取得するURL"),
            }),
        });
    const getEdges = tool(
        async () => {
            const result = await prisma.edge.findMany({
                where: {projectId},
            });
            return JSON.stringify(result);
        },
        {
            name: "getEdges",
            description: "UIState間の遷移情報を取得します",
            schema: z.object({}),
        });
    const getUIStates = tool(
        async () => {
            const result = await prisma.uiState.findMany({
                where: {projectId},
            });
            return JSON.stringify(result);
        },
        {
            name: "getUIStates",
            description: "保存済みのUIState情報を取得します",
            schema: z.object({}),
        });
    return [getPages, getLabels, getEdges, getUIStates];
}


export const createAllTools = (prisma: PrismaService, projectId: string) => {
    const referenceTools = createReferenceTools(prisma, projectId);
    const savePage = tool(
        ({title, url}) => {
            console.log("Save Page:", url);
            return prisma.page.upsert({
                where: {
                    projectId_url: {
                        projectId,
                        url,
                    }
                },
                update: {},
                create: {
                    projectId,
                    url,
                    title,
                },
            });
        },
        {
            name: "savePage",
            description: "サイト内のページ情報を保存します",
            schema: z.object({
                title: z.string().describe("ページのタイトルまたは識別子"),
                url: z.string().describe("ページのURL"),
            }),
        });
    const saveLabel = tool(
        async ({name, description, selector, elementText, url, uiStateId}) => {
            const result = await prisma.label.create({
                data: {
                    projectId,
                    url,
                    selector,
                    name,
                    description,
                    elementText,
                    uiStateId
                },
            });
            return result
        },
        {
            name: "saveLabel",
            description: "DOM要素の情報を保存します",
            schema: z.object({
                name: z.string().describe("DOM要素の名前"),
                description: z.string().describe("要素の用途・説明"),
                selector: z.string().describe("Playwright用セレクタ"),
                elementText: z.string().optional().describe("要素のテキスト"),
                url: z.string().describe("このラベルが存在するURL"),
                uiStateId: z.string().describe("このラベルが存在するUIStateのID"),
            }),
        });
    const saveEdge = tool(
        async ({fromUIStateId, toUIStateId, description, triggeredBy, triggerType}) => {
            return prisma.edge.create({
                data: {
                    projectId,
                    fromUIStateId,
                    toUIStateId,
                    description,
                    triggeredBy,
                    triggerType,
                },
            });
        },
        {
            name: "saveEdge",
            description: "ページ間の遷移情報を保存します",
            schema: z.object({
                fromUIStateId: z.string().describe("遷移元のUIStateのID"),
                toUIStateId: z.string().describe("遷移先のUIStateのID"),
                description: z.string().describe("どのボタンを押して遷移するかなど"),
                triggeredBy: z.string().optional().describe("どの要素をもとにこのUIStateへ遷移したか(Playwrightで要素を取得できる情報)"),
                triggerType: z.string().optional().describe("clickなどの動作"),
            }),
        });
    const saveUIState = tool(
        async ({title, description, pageUrl, isDefault}) => {
            if(isDefault) {
                if(await prisma.uiState.count({
                    where: {
                        projectId,
                        pageUrl,
                        isDefault: true,
                    },
                }) > 0) {
                    throw new Error("既にデフォルトのUIStateが存在します");
                }
            }
            return prisma.uiState.create({
                data: {
                    projectId,
                    pageUrl,
                    title,
                    description,
                    isDefault,
                },
            });
        },
        {
            name: "saveUIState",
            description: "ページ内のUIStateを保存します",
            schema: z.object({
                title: z.string().describe("UIStateのタイトル"),
                description: z.string().describe("UIStateの説明"),
                pageUrl: z.string().describe("このUIStateが存在するページのURL"),
                isDefault: z.boolean().optional().describe("このUIStateがページのデフォルトのUIStateかどうか"),
            }),
        });
    return [savePage, saveLabel, saveEdge, saveUIState, ...referenceTools];
}
