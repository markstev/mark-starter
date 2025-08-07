import postgres from "postgres";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

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

// Simple RLS client that just needs a userId
export function createRLSClient(userId?: string, publicToken?: string) {
  return {
    // Use the existing db instance but wrap transactions with RLS context
    transaction: (async (transaction, ...rest) => {
      return await db.transaction(async (tx) => {
        try {
          // Set the user ID for RLS policies - execute commands separately
          if (userId) {
            await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, TRUE)`);
          }
          if (publicToken) {
            await tx.execute(sql`select set_config('request.jwt.claim.public_token', ${publicToken}, TRUE)`);
          }
          await tx.execute(sql`set local role authenticated`);
          return await transaction(tx);
        } finally {
          // Clean up - execute commands separately
          await tx.execute(sql`select set_config('request.jwt.claim.sub', NULL, TRUE)`);
          await tx.execute(sql`select set_config('request.jwt.claim.public_token', NULL, TRUE)`);
          await tx.execute(sql`reset role`);
        }
      }, ...rest);
    }) as typeof db.transaction,

  };
}
