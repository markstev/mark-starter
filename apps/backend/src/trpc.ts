import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { getUserAndOrgId, isStaffAdmin } from './pkg/middleware/clerk-auth';
import { Context } from 'hono';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/v11/data-transformers
   */
  transformer: superjson,
  /**
   * @see https://trpc.io/docs/v11/error-formatting
   */
  errorFormatter({ error, shape }) {
    console.log("error", error);
    return shape;
  },
  sse: {
    maxDurationMs: 5 * 60 * 1_000, // 5 minutes
    ping: {
      enabled: true,
      intervalMs: 3_000,
    },
    client: {
      reconnectAfterInactivityMs: 5_000,
    },
  },
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

// Organization procedure that automatically handles org authentication
export const organizationProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { userId, orgId } = getUserAndOrgId(ctx as Context);
  if (!orgId) {
    throw new Error("Organization ID required");
  }
  
  return next({
    ctx: {
      ...ctx,
      userId,
      orgId,
    },
  });
});

// Staff procedure that automatically handles staff admin authentication
export const staffProcedure = t.procedure.use(async ({ ctx, next }) => {
  const isStaff = await isStaffAdmin(ctx as Context);
  if (!isStaff) {
    throw new Error("Staff admin access required");
  }
  
  return next({
    ctx: {
      ...ctx,
      userId: getUserAndOrgId(ctx as Context).userId,
    },
  });
});