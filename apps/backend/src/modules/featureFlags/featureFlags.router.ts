import { publicProcedure, router, staffProcedure } from "../../trpc";
import { 
  getUserFeatureFlagsMap, 
  getFlagState,
  setFlag,
  removeUserFlag,
  removeOrganizationFlag
} from "../../pkg/util/featureFlags";
import { z } from "zod";
import { Context } from "hono";
import { getUserAndOrgIdOrNull } from "../../pkg/middleware/clerk-auth";

export const featureFlagsRouter = router({
  getUserFlags: publicProcedure
    .output(z.record(z.boolean()))
    .query(async ({ ctx }) => {
      const { userId, orgId } = getUserAndOrgIdOrNull(ctx as Context);
      const flagsMap = await getUserFeatureFlagsMap(userId, orgId);
      return Object.fromEntries(flagsMap);
    }),

  isFlagEnabled: publicProcedure
    .input(z.object({ flagName: z.string() }))
    .output(z.boolean())
    .query(async ({ ctx, input }) => {
      const { userId, orgId } = getUserAndOrgIdOrNull(ctx as Context);
      const flagsMap = await getUserFeatureFlagsMap(userId, orgId);
      return flagsMap.get(input.flagName) ?? false;
    }),

  getFlagState: staffProcedure
    .input(z.object({ 
      organizationId: z.string().optional(),
      userId: z.string().optional()
    }))
    .output(z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      defaultState: z.boolean(),
      organizationOverride: z.boolean().nullable(),
      userOverride: z.boolean().nullable(),
      effectiveState: z.boolean()
    })))
    .query(async ({ ctx, input }) => {
      return await getFlagState(input.organizationId, input.userId);
    }),

  setFlag: staffProcedure
    .input(z.object({ 
      flagId: z.string(), 
      enabled: z.boolean(),
      level: z.enum(["user", "organization", "default"]),
      userId: z.string().optional(),
      organizationId: z.string().optional()
    }))
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      const result = await setFlag(
        input.flagId, 
        input.enabled, 
        input.level, 
        input.userId, 
        input.organizationId
      );
      return result;
    }),

  removeUserFlag: staffProcedure
    .input(z.object({ flagId: z.string(), userId: z.string() }))
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      const result = await removeUserFlag(input.flagId, input.userId);
      return result;
    }),

  removeOrganizationFlag: staffProcedure
    .input(z.object({ flagId: z.string(), organizationId: z.string() }))
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      const result = await removeOrganizationFlag(input.flagId, input.organizationId);
      return result;
    })
}); 