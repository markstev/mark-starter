import { db, tenants } from "@repo/db";
import { eq } from "drizzle-orm";

type NewTenant = typeof tenants.$inferInsert;

export const tenantsService = {
  async list() {
    return db.select().from(tenants);
  },

  async create(data: Omit<NewTenant, "id" | "createdAt" | "updatedAt">) {
    return db
      .insert(tenants)
      .values({
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  },

  async update(id: string, data: Partial<NewTenant>) {
    return db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
  },

  async delete(id: string) {
    return db.delete(tenants).where(eq(tenants.id, id)).returning();
  },
}; 