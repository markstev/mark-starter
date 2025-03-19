import { db } from '@repo/db';
import { publicProcedure, router } from './trpc';
import { tenants } from '@repo/db';
import { z } from 'zod';

const appRouter = router({
  getTenants: publicProcedure
    .query(async () => {
      // Retrieve users from a datasource, this is an imaginary database
      return await db.select().from(tenants);
    }),

    createTenant: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return await db.insert(tenants).values({
        id: crypto.randomUUID(),
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    }),
});

export default appRouter;
export type AppRouter = typeof appRouter;