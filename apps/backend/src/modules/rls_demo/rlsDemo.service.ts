import { db, eq, and, type NewRlsExample, rlsExample } from "@repo/db";
import { createRLSClient } from "@repo/db/src/client";
import { newId } from "@repo/id";

export const rlsDemoService = {
  createRlsExample,
  getRlsExamples,
  getRlsExampleById,
  updateRlsExample,
  deleteRlsExample,
  getRlsExampleByPublicToken,
  streamRlsExamples,
};

async function createRlsExample(data: Omit<NewRlsExample, "id">, userId: string) {
  const rlsClient = createRLSClient(userId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.insert(rlsExample).values({
      ...data,
      id: newId("rlsExample"),
    }).returning();
    });
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRlsExamples(userId: string) {
  const rlsClient = createRLSClient(userId);
  try {
    const results = await rlsClient.transaction(async (tx) => {
      return await tx.select().from(rlsExample).where(eq(rlsExample.userId, userId));
    });
    return results ?? [];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRlsExampleById(id: string, userId: string) {
  const rlsClient = createRLSClient(userId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.select().from(rlsExample)
      .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)));
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateRlsExample(id: string, userId: string, data: Partial<NewRlsExample>) {
  const rlsClient = createRLSClient(userId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.update(rlsExample)
      .set(data)
      .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)))
      .returning();
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteRlsExample(id: string, userId: string) {
  const rlsClient = createRLSClient(userId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.delete(rlsExample)
      .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)))
      .returning();
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRlsExampleByPublicToken(publicToken: string) {
  const rlsClient = createRLSClient(undefined, publicToken);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.select().from(rlsExample)
        .where(eq(rlsExample.publicToken, publicToken));
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function* streamRlsExamples(userId: string) {
  const rlsClient = createRLSClient(userId);
  
  while (true) {
    try {
      // Read all accessible RLS examples for the user
      const examples = await rlsClient.transaction(async (tx) => {
        return await tx.select().from(rlsExample).where(eq(rlsExample.userId, userId));
      });

      // Yield each example one by one with 2-second intervals
      for (const example of examples) {
        yield {
          type: 'example' as const,
          data: example,
          timestamp: new Date().toISOString(),
        };
        
        // Wait 2 seconds before yielding the next example
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Wait 3 seconds before the next cycle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('Error in streamRlsExamples:', error);
      yield {
        type: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      
      // Wait 3 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
} 