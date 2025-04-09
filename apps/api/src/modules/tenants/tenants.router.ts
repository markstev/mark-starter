import { publicProcedure, router } from "../../core/trpc";
import { tenantsService } from "./tenants.service";
import { z } from "zod";

const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const tenantsRouter = router({
  list: publicProcedure
    .output(z.array(TenantSchema))
    .query(async () => {
      return tenantsService.list();
    }),

  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .output(TenantSchema)
    .mutation(async ({ input }) => {
      return tenantsService.create(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .output(TenantSchema)
    .mutation(async ({ input }) => {
      return tenantsService.update(input.id, { name: input.name });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(TenantSchema)
    .mutation(async ({ input }) => {
      return tenantsService.delete(input.id);
    })
}); 