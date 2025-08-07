import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

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