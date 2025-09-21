import { db, eq, and, type NewRlsOrgExample, rlsOrgExample } from "@repo/db";
import { createRLSClient } from "@repo/db/src/client";
import { newId } from "@repo/id";

export const rlsOrgDemoService = {
  createRlsOrgExample,
  getRlsOrgExamples,
  getRlsOrgExampleById,
  updateRlsOrgExample,
  deleteRlsOrgExample,
  streamRlsOrgExamples,
};

async function createRlsOrgExample(data: Omit<NewRlsOrgExample, "id">, organizationId: string) {
  const rlsClient = createRLSClient(undefined, organizationId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.insert(rlsOrgExample).values({
        ...data,
        id: newId("rlsOrgExample"),
      }).returning();
    });
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRlsOrgExamples(organizationId: string) {
  const rlsClient = createRLSClient(undefined, organizationId);
  try {
    const results = await rlsClient.transaction(async (tx) => {
      return await tx.select().from(rlsOrgExample).where(eq(rlsOrgExample.organizationId, organizationId));
    });
    return results ?? [];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRlsOrgExampleById(id: string, organizationId: string) {
  const rlsClient = createRLSClient(undefined, organizationId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.select().from(rlsOrgExample)
        .where(and(eq(rlsOrgExample.id, id), eq(rlsOrgExample.organizationId, organizationId)));
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateRlsOrgExample(id: string, organizationId: string, data: Partial<NewRlsOrgExample>) {
  const rlsClient = createRLSClient(undefined, organizationId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.update(rlsOrgExample)
        .set(data)
        .where(and(eq(rlsOrgExample.id, id), eq(rlsOrgExample.organizationId, organizationId)))
        .returning();
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteRlsOrgExample(id: string, organizationId: string) {
  const rlsClient = createRLSClient(undefined, organizationId);
  try {
    const result = await rlsClient.transaction(async (tx) => {
      return await tx.delete(rlsOrgExample)
        .where(and(eq(rlsOrgExample.id, id), eq(rlsOrgExample.organizationId, organizationId)))
        .returning();
    });
    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function* streamRlsOrgExamples(organizationId: string) {
  const rlsClient = createRLSClient(undefined, organizationId);
  
  while (true) {
    try {
      // Read all accessible RLS organization examples for the organization
      const examples = await rlsClient.transaction(async (tx) => {
        return await tx.select().from(rlsOrgExample).where(eq(rlsOrgExample.organizationId, organizationId));
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
      console.error('Error in streamRlsOrgExamples:', error);
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