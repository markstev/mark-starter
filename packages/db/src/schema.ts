import { pgTable, text, timestamp, varchar, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { lifecycleDates } from "./util/lifecycle-dates";
export const users = pgTable("users", {
  userId: varchar("user_id", { length: 128 }).primaryKey(),
  // Add more clerk fields you want to sync here
  email: text("email").notNull(),
  ...lifecycleDates,
});

export const posts = pgTable("posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.userId),
  ...lifecycleDates,
});

export const tenants = pgTable("tenants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ...lifecycleDates,
});

export const tenantUsers = pgTable("tenant_users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 })
    .notNull()
    .references(() => tenants.id),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.userId),
  ...lifecycleDates,
});

// Feature Flags System
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  defaultState: boolean("default_state").notNull().default(false),
  ...lifecycleDates,
}, (table) => [
  index("feature_flags_name_idx").on(table.name),
]);

export const userFeatureFlags = pgTable("user_feature_flags", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  featureFlagId: varchar("feature_flag_id", { length: 255 })
    .notNull()
    .references(() => featureFlags.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull(),
  ...lifecycleDates,
}, (table) => [
  index("user_feature_flags_user_id_idx").on(table.userId),
  index("user_feature_flags_feature_flag_id_idx").on(table.featureFlagId),
  uniqueIndex("user_feature_flags_user_flag_unique").on(table.userId, table.featureFlagId),
]);
