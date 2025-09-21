import { publicProcedure, router } from "../../trpc";
import { rlsOrgDemoService } from "./rlsOrgDemo.service";
import { z } from "zod";
import { getUserAndOrgId } from "../../pkg/middleware/clerk-auth";
import { Context } from "hono";
import { unpackAccessToken } from "../auth/socket_auth";

// Define the RLS Organization Example schema
const RlsOrgExampleSchema = z.object({
  id: z.string(),
  content: z.string(),
  organizationId: z.string(),
  publicToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const rlsOrgDemoRouter = router({
  // Get all RLS organization examples for the authenticated organization
  listForOrganization: publicProcedure
    .output(z.array(RlsOrgExampleSchema))
    .query(async ({ ctx }) => {
      const { orgId } = getUserAndOrgId(ctx as Context);
      if (!orgId) throw new Error("Organization ID required");
      return rlsOrgDemoService.getRlsOrgExamples(orgId);
    }),

  // Get a specific RLS organization example by ID (only if organization owns it)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(RlsOrgExampleSchema.nullable())
    .query(async ({ input, ctx }) => {
      const { orgId } = getUserAndOrgId(ctx as Context);
      if (!orgId) throw new Error("Organization ID required");
      return rlsOrgDemoService.getRlsOrgExampleById(input.id, orgId);
    }),

  // Create a new RLS organization example
  create: publicProcedure
    .input(z.object({
      content: z.string().min(1),
      publicToken: z.string().optional(),
    }))
    .output(RlsOrgExampleSchema)
    .mutation(async ({ input, ctx }) => {
      const { orgId } = getUserAndOrgId(ctx as Context);
      if (!orgId) throw new Error("Organization ID required");
      const result = await rlsOrgDemoService.createRlsOrgExample({
        ...input,
        organizationId: orgId,
      }, orgId);
      if (!result) throw new Error('Failed to create RLS organization example');
      return result;
    }),

  // Update an RLS organization example (only if organization owns it)
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      content: z.string().min(1).optional(),
      publicToken: z.string().optional(),
    }))
    .output(RlsOrgExampleSchema.nullable())
    .mutation(async ({ input, ctx }) => {
      const { orgId } = getUserAndOrgId(ctx as Context);
      if (!orgId) throw new Error("Organization ID required");
      const { id, ...data } = input;
      const result = await rlsOrgDemoService.updateRlsOrgExample(id, orgId, data);
      if (!result) throw new Error('Failed to update RLS organization example');
      return result;
    }),

  // Delete an RLS organization example (only if organization owns it)
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { orgId } = getUserAndOrgId(ctx as Context);
      if (!orgId) throw new Error("Organization ID required");
      const result = await rlsOrgDemoService.deleteRlsOrgExample(input.id, orgId);
      if (!result) throw new Error('Failed to delete RLS organization example');
      return result;
    }),

}); 