import { db, tenants } from "@repo/db";
import { eq } from "drizzle-orm";

type NewTenant = typeof tenants.$inferInsert;

export const tenantsService = {
  async list() {
    try {
      const result = await db.select().from(tenants);
      if (!result) {
        return [];
      }
      return result;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return []; // Return empty array instead of throwing
    }
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

  // ... other methods
}; 