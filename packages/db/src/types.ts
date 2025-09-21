import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import * as schema from "./schema";

export type Post = InferSelectModel<typeof schema.posts>;
export type NewPost = InferInsertModel<typeof schema.posts>;

export const postInsertSchema = createInsertSchema(schema.posts).omit({ userId: true });
export const postSelectSchema = createSelectSchema(schema.posts);

export type RlsExample = InferSelectModel<typeof schema.rlsExample>;
export type NewRlsExample = InferInsertModel<typeof schema.rlsExample>;

export const rlsExampleInsertSchema = createInsertSchema(schema.rlsExample).omit({ userId: true });
export const rlsExampleSelectSchema = createSelectSchema(schema.rlsExample);

// RLS Organization Example types
export type RlsOrgExample = InferSelectModel<typeof schema.rlsOrgExample>;
export type NewRlsOrgExample = InferInsertModel<typeof schema.rlsOrgExample>;

export const rlsOrgExampleInsertSchema = createInsertSchema(schema.rlsOrgExample).omit({ organizationId: true });
export const rlsOrgExampleSelectSchema = createSelectSchema(schema.rlsOrgExample);
