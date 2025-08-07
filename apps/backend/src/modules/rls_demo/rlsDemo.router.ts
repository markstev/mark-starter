import { publicProcedure, router } from "../../trpc";
import { rlsDemoService } from "./rlsDemo.service";
import { z } from "zod";
import { getUserId } from "../../pkg/middleware/clerk-auth";
import { Context } from "hono";
import { unpackAccessToken } from "../auth/socket_auth";

// Define the RLS Example schema
const RlsExampleSchema = z.object({
  id: z.string(),
  content: z.string(),
  userId: z.string(),
  publicToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const rlsDemoRouter = router({
  // Get all RLS examples for the authenticated user
  listForUser: publicProcedure
    .output(z.array(RlsExampleSchema))
    .query(async ({ ctx }) => {
      const userId = getUserId(ctx as Context);
      return rlsDemoService.getRlsExamples(userId);
    }),

  // Get a specific RLS example by ID (only if user owns it)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(RlsExampleSchema.nullable())
    .query(async ({ input, ctx }) => {
      const userId = getUserId(ctx as Context);
      return rlsDemoService.getRlsExampleById(input.id, userId);
    }),

  // Create a new RLS example
  create: publicProcedure
    .input(z.object({
      content: z.string().min(1),
      publicToken: z.string().optional(),
    }))
    .output(RlsExampleSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = getUserId(ctx as Context);
      const result = await rlsDemoService.createRlsExample({
        ...input,
        userId: userId,
      }, userId);
      if (!result) throw new Error('Failed to create RLS example');
      return result;
    }),

  // Update an RLS example (only if user owns it)
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      content: z.string().min(1).optional(),
      publicToken: z.string().optional(),
    }))
    .output(RlsExampleSchema.nullable())
    .mutation(async ({ input, ctx }) => {
      const userId = getUserId(ctx as Context);
      const { id, ...data } = input;
      const result = await rlsDemoService.updateRlsExample(id, userId, data);
      if (!result) throw new Error('Failed to update RLS example');
      return result;
    }),

  // Delete an RLS example (only if user owns it)
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = getUserId(ctx as Context);
      const result = await rlsDemoService.deleteRlsExample(input.id, userId);
      if (!result) throw new Error('Failed to delete RLS example');
      return result;
    }),

  // Public access to examples with a token (no auth required)
  getByPublicToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .output(RlsExampleSchema.nullable())
    .query(async ({ input }) => {
      return rlsDemoService.getRlsExampleByPublicToken(input.token);
    }),

  // Subscription to stream RLS examples for a user
  streamExamples: publicProcedure
    .input(z.object({
      accessJwt: z.string(),
    }))
    .subscription(async function* (opts) {
      const { accessJwt } = opts.input;
      const resources = await unpackAccessToken(accessJwt);
      
      for await (const result of rlsDemoService.streamRlsExamples(resources.user_id)) {
        yield result;
      }
    }),
}); 