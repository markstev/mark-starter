import { buildSchema, execute, parse, subscribe } from 'graphql';
import { rlsExample } from '@repo/db';
import { eq, and } from 'drizzle-orm';
import { newId } from '@repo/id';
import { createRLSClient, db } from '@repo/db/src/client';

// GraphQL Schema Definition for RLS Example
const rlsExampleSchema = buildSchema(`
  type RlsExample {
    id: String!
    content: String!
    userId: String!
    publicToken: String
    createdAt: String!
    updatedAt: String
  }

  type Query {
    getRlsExamples: [RlsExample!]!
    getRlsExamplesNoTransaction: [RlsExample!]!
    getRlsExample(id: String!): RlsExample
  }

  type Mutation {
    createRlsExample(content: String!): RlsExample!
    updateRlsExample(id: String!, content: String!): RlsExample!
    deleteRlsExample(id: String!): Boolean!
  }

  type Subscription {
    rlsExampleUpdates: RlsExample!
  }
`);

// RLS Example Resolvers
export const createRlsExampleResolvers = (userId: string) => ({
  // Query resolvers
  getRlsExamples: async () => {
    const rlsClient = createRLSClient(userId);
    try {
      const results = await rlsClient.transaction(async (tx) => {
        return await tx.select().from(rlsExample).where(eq(rlsExample.userId, userId));
      });
      return results.map(example => ({
        ...example,
        createdAt: example.createdAt.toISOString(),
        updatedAt: example.updatedAt?.toISOString() || null,
      }));
    } catch (error) {
      throw new Error('Failed to fetch RLS examples');
    }
  },

  getRlsExamplesNoTransaction: async () => {
    try {
        const results = await db.select().from(rlsExample).where(eq(rlsExample.userId, userId));
        console.log("no transaction results", results);
        return results.map(example => ({
            ...example,
            createdAt: example.createdAt.toISOString(),
            updatedAt: example.updatedAt?.toISOString() || null,
        }));
    } catch (error) {
        throw new Error('Failed to fetch RLS exmaples');
    }
  },

  getRlsExample: async ({ id }: { id: string }) => {
    const rlsClient = createRLSClient(userId);
    try {
      const result = await rlsClient.transaction(async (tx) => {
        return await tx.select().from(rlsExample)
          .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)));
      });
      
      if (result.length === 0) return null;
      
      const example = result[0];
      return {
        ...example,
        createdAt: example?.createdAt.toISOString(),
        updatedAt: example?.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to fetch RLS example');
    }
  },

  // Mutation resolvers
  createRlsExample: async ({ content }: { content: string }) => {
    const rlsClient = createRLSClient(userId);
    try {
      const result = await rlsClient.transaction(async (tx) => {
        return await tx.insert(rlsExample).values({
          id: newId('rlsExample'),
          content,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
      });
      
      const example = result[0]!;
      return {
        ...example,
        createdAt: example.createdAt.toISOString(),
        updatedAt: example.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to create RLS example');
    }
  },

  updateRlsExample: async ({ id, content }: { id: string; content: string }) => {
    const rlsClient = createRLSClient(userId);
    try {
      const result = await rlsClient.transaction(async (tx) => {
        return await tx.update(rlsExample)
          .set({ content, updatedAt: new Date() })
          .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)))
          .returning();
      });
      
      if (result.length === 0) throw new Error('RLS example not found or access denied');
      
      const example = result[0]!;
      return {
        ...example,
        createdAt: example.createdAt.toISOString(),
        updatedAt: example.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to update RLS example');
    }
  },

  deleteRlsExample: async ({ id }: { id: string }) => {
    const rlsClient = createRLSClient(userId);
    try {
      const result = await rlsClient.transaction(async (tx) => {
        return await tx.delete(rlsExample)
          .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)))
          .returning();
      });
      
      return result.length > 0;
    } catch (error) {
      throw new Error('Failed to delete RLS example');
    }
  },

  // Subscription resolvers
  rlsExampleUpdates: async function* () {
    const rlsClient = createRLSClient(userId);
    
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        // Get a random RLS example for the user
        const results = await rlsClient.transaction(async (tx) => {
          return await tx.select().from(rlsExample)
            .where(eq(rlsExample.userId, userId))
            .limit(1);
        });
        
        if (results.length > 0) {
          const example = results[0];
          yield {
            ...example,
            createdAt: example?.createdAt.toISOString(),
            updatedAt: example?.updatedAt?.toISOString() || null,
          };
        }
      } catch (error) {
        console.error('Error in rlsExampleUpdates subscription:', error);
        yield {
          id: 'error',
          content: 'Error occurred',
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        };
      }
    }
  },
});

// GraphQL execution functions for RLS Example
export const executeRlsExampleGraphQLQuery = async (query: string, variables: any, userId: string) => {
  const document = parse(query);
  const rootValue = createRlsExampleResolvers(userId);
  
  return await execute({
    schema: rlsExampleSchema,
    document,
    rootValue,
    variableValues: variables,
  });
};

export const executeRlsExampleGraphQLSubscription = async (query: string, variables: any, userId: string) => {
  const document = parse(query);
  const rootValue = createRlsExampleResolvers(userId);
  
  return await subscribe({
    schema: rlsExampleSchema,
    document,
    rootValue,
    variableValues: variables,
  });
};

export { rlsExampleSchema };
