import { publicProcedure, router } from "../../trpc";
import { getUserFeatureFlagsMap } from "../../pkg/util/featureFlags";
import { z } from "zod";
import { Context } from "hono";
import { getAuth, getUserId } from "@/pkg/middleware/clerk-auth";

export const featureFlagsRouter = router({
  getUserFlags: publicProcedure
    .output(z.record(z.boolean()))
    .query(async ({ ctx }) => {
      const auth = getAuth(ctx as Context);
      const flagsMap = await getUserFeatureFlagsMap(auth?.userId);
      return Object.fromEntries(flagsMap);
    }),

  isFlagEnabled: publicProcedure
    .input(z.object({ flagName: z.string() }))
    .output(z.boolean())
    .query(async ({ ctx, input }) => {
      const auth = getAuth(ctx as Context);
      const flagsMap = await getUserFeatureFlagsMap(auth?.userId);
      return flagsMap.get(input.flagName) ?? false;
    }),
}); 