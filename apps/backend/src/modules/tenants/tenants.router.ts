import { publicProcedure, router } from "../../trpc";
import { tenantsService } from "./tenants.service";
import { z } from "zod";

// Define the Tenant schema
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
    .input(z.object({ name: z.string().min(1) }))
    .output(TenantSchema)
    .mutation(async ({ input }) => {
      const result = await tenantsService.create(input);
      if (!result) throw new Error('Failed to create tenant');
      return result;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
    }))
    .output(TenantSchema)
    .mutation(async ({ input }) => {
      const result = await tenantsService.update(input.id, { name: input.name });
      if (!result) throw new Error('Failed to update tenant');
      return result;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(TenantSchema)
    .mutation(async ({ input }) => {
      const result = await tenantsService.delete(input.id);
      if (!result) throw new Error('Failed to delete tenant');
      return result;
    }),
}); 