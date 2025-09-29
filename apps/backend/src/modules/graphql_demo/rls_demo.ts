import { buildSchema, execute, parse, subscribe, defaultFieldResolver } from 'graphql';
import { rlsExample, rlsComment } from '@repo/db';
import { eq, and, inArray } from 'drizzle-orm';
import { newId } from '@repo/id';
import { createRLSClient, db } from '@repo/db/src/client';
import DataLoader from 'dataloader';
import type { PgTransaction } from 'drizzle-orm/pg-core';

type RLSGraphQLContext = {
  userId: string;
  tx: PgTransaction<any, any, any>;
  loaders: {
    commentsLoader: DataLoader<string, any[]>;
  }
};

// GraphQL Schema Definition for RLS Example
const rlsExampleSchema = buildSchema(`
  type RlsComment {
    id: String!
    text: String!
    userId: String!
    parentExampleId: String!
    createdAt: String!
    updatedAt: String
  }

  type RlsExample {
    id: String!
    content: String!
    userId: String!
    publicToken: String
    createdAt: String!
    updatedAt: String
    comments: [RlsComment!]!
  }

  type Query {
    getRlsExamples: [RlsExample!]!
    getRlsExample(id: String!): RlsExample
    getRlsComments(parentExampleId: String!): [RlsComment!]!
  }

  type Mutation {
    createRlsExample(content: String!): RlsExample!
    updateRlsExample(id: String!, content: String!): RlsExample!
    deleteRlsExample(id: String!): Boolean!
    createRlsComment(parentExampleId: String!, text: String!): RlsComment!
    updateRlsComment(id: String!, text: String!): RlsComment!
    deleteRlsComment(id: String!): Boolean!
  }

  type Subscription {
    rlsExampleUpdates: RlsExample!
  }
`);

// RLS Example Resolvers
export const createRlsExampleResolvers = (tx: PgTransaction<any, any, any>, userId: string) => ({
  // Query resolvers
  getRlsExamples: async (_: any, __: any, context: RLSGraphQLContext) => {
    try {
      const results = await tx.select().from(rlsExample).where(eq(rlsExample.userId, userId));
      
      return results.map(example => ({
        ...example,
        createdAt: example.createdAt.toISOString(),
        updatedAt: example.updatedAt?.toISOString() || null,
      }));
    } catch (error) {
      throw new Error('Failed to fetch RLS examples' + error);
    }
  },

  getRlsExample: async (_: any, { id }: { id: string }, context: RLSGraphQLContext) => {
    try {
      const examples = await tx.select().from(rlsExample)
        .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)));
        
      if (examples.length === 0) return null;
        
      const result = examples[0]!;
      
      if (!result) return null;
      
      return {
        ...result,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to fetch RLS example');
    }
  },

  getRlsComments: async (_: any, { parentExampleId }: { parentExampleId: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.select().from(rlsComment)
        .where(and(
          eq(rlsComment.parentExampleId, parentExampleId),
          eq(rlsComment.userId, userId)
        ));
      
      return result.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt?.toISOString() || null,
      }));
    } catch (error) {
      throw new Error('Failed to fetch RLS comments');
    }
  },

  // Mutation resolvers
  createRlsExample: async (_: any, { content }: { content: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.insert(rlsExample).values({
        id: newId('rlsExample'),
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      const example = result[0]!;
      return {
        ...example,
        createdAt: example.createdAt.toISOString(),
        updatedAt: example.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to create RLS example ' + error);
    }
  },

  updateRlsExample: async (_: any, { id, content }: { id: string; content: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.update(rlsExample)
        .set({ content, updatedAt: new Date() })
        .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)))
        .returning();
      
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

  deleteRlsExample: async (_: any, { id }: { id: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.delete(rlsExample)
        .where(and(eq(rlsExample.id, id), eq(rlsExample.userId, userId)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      throw new Error('Failed to delete RLS example');
    }
  },

  createRlsComment: async (_: any, { parentExampleId, text }: { parentExampleId: string; text: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.insert(rlsComment).values({
        id: newId('rlsComment'),
        parentExampleId,
        text,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      const comment = result[0]!;
      return {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to create RLS comment ' + error);
    }
  },

  updateRlsComment: async (_: any, { id, text }: { id: string; text: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.update(rlsComment)
        .set({ text, updatedAt: new Date() })
        .where(and(eq(rlsComment.id, id), eq(rlsComment.userId, userId)))
        .returning();
      
      if (result.length === 0) throw new Error('RLS comment not found or access denied');
      
      const comment = result[0]!;
      return {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to update RLS comment');
    }
  },

  deleteRlsComment: async (_: any, { id }: { id: string }, context: RLSGraphQLContext) => {
    try {
      const result = await tx.delete(rlsComment)
        .where(and(eq(rlsComment.id, id), eq(rlsComment.userId, userId)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      throw new Error('Failed to delete RLS comment');
    }
  },

  // Subscription resolvers
  rlsExampleUpdates: async function* (_: any, __: any, context: RLSGraphQLContext) {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        // Get a random RLS example for the user
        const results = await tx.select().from(rlsExample)
          .where(eq(rlsExample.userId, userId))
          .limit(1);
        
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

const RlsExampleResolver = {
  RlsExample: {
    comments: async (parent: any, _: any, { loaders }: RLSGraphQLContext) => {
      return loaders.commentsLoader.load(parent.id);
    }
  }
};

// GraphQL execution functions for RLS Example
export const executeRlsExampleGraphQLQuery = async (query: string, variables: any, userId: string) => {
  const document = parse(query);
  const rlsClient = createRLSClient(userId);

  return await rlsClient.transaction(async (tx) => {
    const commentsLoader = new DataLoader(async (parentExampleIds: readonly string[]) => {
      const comments = await tx.select()
        .from(rlsComment)
        .where(inArray(rlsComment.parentExampleId, [...parentExampleIds]));

      const commentsByParentId = comments.reduce((acc: Record<string, any[]>, comment: any) => {
        const key = comment.parentExampleId;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt?.toISOString() || null,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return parentExampleIds.map((id) => commentsByParentId[id] || []);
    });

    const rootResolvers = createRlsExampleResolvers(tx, userId);

    const variableValues = variables ?? {};
    const resp = await execute({
      schema: rlsExampleSchema,
      document,
      rootValue: rootResolvers,
      contextValue: {
        userId,
        tx,
        loaders: {
          commentsLoader,
        },
      },
      variableValues: variableValues,
      fieldResolver: (source, args, context, info) => {
        const typeName = info.parentType.name;
        // @ts-ignore
        if (RlsExampleResolver[typeName] && RlsExampleResolver[typeName][info.fieldName]) {
          // @ts-ignore
          return RlsExampleResolver[typeName][info.fieldName](source, args, context, info);
        }
          return defaultFieldResolver(source, args, context, info);
        },
      });
    return resp;
  });
};

export const executeRlsExampleGraphQLSubscription = async (query: string, variables: any, userId: string) => {
  const document = parse(query);
  const rlsClient = createRLSClient(userId);
  
  return rlsClient.transaction(async (tx) => {
    // Note: DataLoader is typically most useful for batching within a single request (query/mutation).
    // For subscriptions, the context is long-lived, so care must be taken.
    // A new loader should be created if the underlying data can change during the subscription's life.
    // For simplicity here, we'll follow the same pattern as the query.
    const commentsLoader = new DataLoader(async (parentExampleIds: readonly string[]) => {
      const comments = await tx.select()
        .from(rlsComment)
        .where(inArray(rlsComment.parentExampleId, [...parentExampleIds]));

      const commentsByParentId = comments.reduce((acc: Record<string, any[]>, comment: any) => {
        const key = comment.parentExampleId;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt?.toISOString() || null,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return parentExampleIds.map((id) => commentsByParentId[id] || []);
    });

    const rootResolvers = createRlsExampleResolvers(tx, userId);

    return await subscribe({
      schema: rlsExampleSchema,
      document,
      rootValue: rootResolvers,
      contextValue: {
        userId,
        tx,
        loaders: {
          commentsLoader,
        },
      },
      variableValues: variables ?? {},
      fieldResolver: (source, args, context, info) => {
        const typeName = info.parentType.name;
        // @ts-ignore
        if (RlsExampleResolver[typeName] && RlsExampleResolver[typeName][info.fieldName]) {
          // @ts-ignore
          return RlsExampleResolver[typeName][info.fieldName](source, args, context, info);
        }
        return defaultFieldResolver(source, args, context, info);
      },
    });
  });
};

export { rlsExampleSchema };
