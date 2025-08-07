import { publicProcedure, router } from "../../trpc";
import { getUserFeatureFlagsMap } from "../../pkg/util/featureFlags";
import { z } from "zod";
import { Context } from "hono";
import { getUserId } from "@/pkg/middleware/clerk-auth";

export const featureFlagsRouter = router({
  getUserFlags: publicProcedure
    .output(z.record(z.boolean()))
    .query(async ({ ctx }) => {
      const userId = getUserId(ctx as Context);
      if (!userId) return {};
      
      const flagsMap = await getUserFeatureFlagsMap(userId);
      return Object.fromEntries(flagsMap);
    }),

  isFlagEnabled: publicProcedure
    .input(z.object({ flagName: z.string() }))
    .output(z.boolean())
    .query(async ({ ctx, input }) => {
      const userId = getUserId(ctx as Context);
      if (!userId) return false;
      
      const flagsMap = await getUserFeatureFlagsMap(userId);
      return flagsMap.get(input.flagName) ?? false;
    }),
}); 