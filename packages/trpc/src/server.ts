import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const publicProcedure = t.procedure;

const appRouter = t.router({
  projectsRouter: t.router({
    generateAllResources: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  featuresRouter: t.router({
    deleteLabel: publicProcedure.input(z.object({
      id: z.string().uuid(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  labelsRouter: t.router({
    deleteLabel: publicProcedure.input(z.object({
      id: z.string().uuid(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  pagesRouter: t.router({
    savePage: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
      url: z.string().url(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  uiStatesRouter: t.router({
    findAll: publicProcedure.output(z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }))).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    findByProject: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
    })).output(z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }))).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    findByPage: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
      pageUrl: z.string().url(),
    })).output(z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }))).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    findOne: publicProcedure.input(z.object({
      id: z.string().uuid(),
    })).output(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    create: publicProcedure.input(z.object({
      title: z.string().min(1).max(100),
      html: z.string().optional(),
      description: z.string().min(1),
      pageUrl: z.string().url(),
      projectId: z.string().uuid(),
      isDefault: z.boolean().optional(),
    })).output(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    update: publicProcedure.input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().min(1).optional(),
      pageUrl: z.string().url().optional(),
      isDefault: z.boolean().optional(),
    })).output(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    remove: publicProcedure.input(z.object({
      id: z.string().uuid(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getDefaultUiState: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
      pageUrl: z.string().url(),
    })).output(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      pageUrl: z.string(),
      projectId: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }).nullable()).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  edgesRouter: t.router({
    getEdgesByProject: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getEdge: publicProcedure.input(z.object({
      id: z.string().uuid(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getEdgesByUIState: publicProcedure.input(z.object({
      uiStateId: z.string().uuid(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    createEdge: publicProcedure.input(z.object({
      projectId: z.string().uuid(),
      fromUIStateId: z.string().uuid(),
      toUIStateId: z.string().uuid(),
      description: z.string(),
      triggeredBy: z.string().optional(),
      triggerType: z.string().optional(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    updateEdge: publicProcedure.input(z.object({
      id: z.string().uuid(),
      fromUIStateId: z.string().uuid().optional(),
      toUIStateId: z.string().uuid().optional(),
      description: z.string().optional(),
      triggeredBy: z.string().optional(),
      triggerType: z.string().optional(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    deleteEdge: publicProcedure.input(z.object({
      id: z.string().uuid(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  })
});
export type AppRouter = typeof appRouter;

