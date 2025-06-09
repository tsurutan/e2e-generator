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
  })
});
export type AppRouter = typeof appRouter;

