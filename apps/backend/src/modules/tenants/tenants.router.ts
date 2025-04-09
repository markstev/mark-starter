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
    .output(TenantSchema.optional())
    .mutation(async ({ input }) => {
      return tenantsService.create(input);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
    }))
    .output(TenantSchema.optional())
    .mutation(async ({ input }) => {
      return tenantsService.update(input.id, { name: input.name });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(TenantSchema.optional())
    .mutation(async ({ input }) => {
      return tenantsService.delete(input.id);
    }),
}); 