import postgres from "postgres";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";

export function createClient(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  const drizzleConfig = {
    schema,
    driver: "pg",
    dbCredentials: {
      connectionString: connectionString,
    },
  };
  return drizzle(client, drizzleConfig);
}

export const db = createClient(process.env.DATABASE_URL!);

export class TenantDrizzleClient {
  private db;
  private tenantId: string;

  constructor(tenantId: string) {
    if (!tenantId) {
      throw new Error("Tenant ID is required.");
    }
    const connectionString = process.env.DATABASE_URL!;
    
    const client = postgres(connectionString, { prepare: false });
    const drizzleConfig = {
      schema,
      driver: "pg",
      dbCredentials: {
        connectionString: connectionString,
      },
    };
    
    this.db = drizzle(client, drizzleConfig);
    this.tenantId = tenantId;
  }

  async query(table: any, filters = {}) {
    return this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.tenantId, this.tenantId),
          ...Object.entries(filters).map(([key, value]) => eq(table[key], value))
        )
      );
  }

  async insert(table: any, data: any) {
    return this.db.insert(table).values({
      ...data,
      tenantId: this.tenantId
    });
  }

  async update(table: any, id: string, data: any) {
    return this.db.update(table)
      .set(data)
      .where(
        and(
          eq(table.id, id),
          eq(table.tenantId, this.tenantId)
        )
      );
  }

  async delete(table: any, id: string) {
    return this.db.delete(table).where(
      and(
        eq(table.id, id),
        eq(table.tenantId, this.tenantId)
      )
    );
  }
}

export function dbForTenant(tenantId: string) {
  return new TenantDrizzleClient(tenantId);
}
