import { db, tenants } from "@repo/db";
import { eq } from "drizzle-orm";

type NewTenant = typeof tenants.$inferInsert;

export const tenantsService = {
  async list() {
    try {
      const results = await db.select().from(tenants);
      return results ?? [];
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async create(data: Omit<NewTenant, "id" | "createdAt" | "updatedAt">) {
    try {
      const result = await db
        .insert(tenants)
        .values({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async update(id: string, data: Partial<NewTenant>) {
    try {
      const result = await db
        .update(tenants)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const result = await db.delete(tenants).where(eq(tenants.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}; 