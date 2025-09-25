import { buildSchema, execute, parse, subscribe } from 'graphql';
import { db, posts, tenants } from '@repo/db';
import { eq } from 'drizzle-orm';
import { newId } from '@repo/id';

// GraphQL Schema Definition
const schema = buildSchema(`
  type Post {
    id: String!
    title: String!
    content: String!
    userId: String!
    createdAt: String!
    updatedAt: String
  }

  type Tenant {
    id: String!
    name: String!
    createdAt: String!
    updatedAt: String
  }

  type Query {
    # RPC-style queries
    getPosts: [Post!]!
    getPost(id: String!): Post
    getTenants: [Tenant!]!
    getTenant(id: String!): Tenant
    
    # Simple RPC functions
    hello(name: String): String!
    addNumbers(a: Int!, b: Int!): Int!
    calculateArea(width: Float!, height: Float!): Float!
  }

  type Mutation {
    # RPC-style mutations
    createPost(title: String!, content: String!, userId: String!): Post!
    updatePost(id: String!, title: String, content: String): Post!
    deletePost(id: String!): Boolean!
    
    createTenant(name: String!): Tenant!
    updateTenant(id: String!, name: String!): Tenant!
    deleteTenant(id: String!): Boolean!
    
    # Simple RPC functions
    processOrder(orderId: String!, amount: Float!): String!
    sendNotification(userId: String!, message: String!): Boolean!
  }

  type Subscription {
    # RPC-style subscriptions
    postUpdates: Post!
    tenantUpdates: Tenant!
    randomNumber: Float!
  }
`);

// GraphQL Resolvers - These are essentially RPC function implementations
const rootValue = {
  // Query RPC functions
  getPosts: async () => {
    try {
      const result = await db.select().from(posts);
      return result.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt?.toISOString() || null,
      }));
    } catch (error) {
      throw new Error('Failed to fetch posts');
    }
  },

  getPost: async ({ id }: { id: string }) => {
    try {
      const result = await db.select().from(posts).where(eq(posts.id, id));
      if (result.length === 0) return null;
      
      const post = result[0];
      return {
        ...post,
        createdAt: post?.createdAt.toISOString(),
        updatedAt: post?.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to fetch post');
    }
  },

  getTenants: async () => {
    try {
      const result = await db.select().from(tenants);
      return result.map(tenant => ({
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt?.toISOString() || null,
      }));
    } catch (error) {
      throw new Error('Failed to fetch tenants');
    }
  },

  getTenant: async ({ id }: { id: string }) => {
    try {
      const result = await db.select().from(tenants).where(eq(tenants.id, id));
      if (result.length === 0) return null;
      
      const tenant = result[0];
      return {
        ...tenant,
        createdAt: tenant?.createdAt.toISOString(),
        updatedAt: tenant?.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to fetch tenant');
    }
  },

  // Simple RPC functions
  hello: ({ name }: { name?: string }) => {
    return name ? `Hello, ${name}!` : 'Hello, World!';
  },

  addNumbers: ({ a, b }: { a: number; b: number }) => {
    return a + b;
  },

  calculateArea: ({ width, height }: { width: number; height: number }) => {
    return width * height;
  },

  // Mutation RPC functions
  createPost: async ({ title, content, userId }: { title: string; content: string; userId: string }) => {
    try {
      const result = await db
        .insert(posts)
        .values({
          id: newId('post'),
          title,
          content,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      const post = result[0]!;
      return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to create post');
    }
  },

  updatePost: async ({ id, title, content }: { id: string; title?: string; content?: string }) => {
    try {
      const updateData: any = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      const result = await db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, id))
        .returning();
      
      if (result.length === 0) throw new Error('Post not found');
      
      const post = result[0]!;
      return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to update post');
    }
  },

  deletePost: async ({ id }: { id: string }) => {
    try {
      const result = await db.delete(posts).where(eq(posts.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      throw new Error('Failed to delete post');
    }
  },

  createTenant: async ({ name }: { name: string }) => {
    try {
      const result = await db
        .insert(tenants)
        .values({
          id: newId('tenant'),
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      const tenant = result[0]!;
      return {
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to create tenant');
    }
  },

  updateTenant: async ({ id, name }: { id: string; name: string }) => {
    try {
      const result = await db
        .update(tenants)
        .set({ name, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();
      
      if (result.length === 0) throw new Error('Tenant not found');
      
      const tenant = result[0]!;
      return {
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      throw new Error('Failed to update tenant');
    }
  },

  deleteTenant: async ({ id }: { id: string }) => {
    try {
      const result = await db.delete(tenants).where(eq(tenants.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      throw new Error('Failed to delete tenant');
    }
  },

  // Business logic RPC functions
  processOrder: async ({ orderId, amount }: { orderId: string; amount: number }) => {
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 100));
    return `Order ${orderId} processed successfully for $${amount}`;
  },

  sendNotification: async ({ userId, message }: { userId: string; message: string }) => {
    // Simulate notification sending
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log(`Notification sent to user ${userId}: ${message}`);
    return true;
  },

  // Subscription RPC functions - Fixed structure
  postUpdates: async function* () {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // This would normally listen to actual database changes
      const mockPost = {
        id: newId('post'),
        title: `Updated Post ${Date.now()}`,
        content: 'This is a real-time update',
        userId: 'user_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      yield mockPost;
    }
  },

  tenantUpdates: async function* () {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      // This would normally listen to actual database changes
      const mockTenant = {
        id: newId('tenant'),
        name: `Updated Tenant ${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      yield mockTenant;
    }
  },

  randomNumber: async function* () {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      yield Math.random();
    }
  },
};

// GraphQL execution functions - Updated to accept userId
export const executeGraphQLQuery = async (query: string, variables?: any, userId?: string) => {
  const document = parse(query);
  return await execute({
    schema,
    document,
    rootValue,
    variableValues: variables,
  });
};

export const executeGraphQLSubscription = async (query: string, variables?: any, userId?: string) => {
  const document = parse(query);
  return await subscribe({
    schema,
    document,
    rootValue,
    variableValues: variables,
  });
};

export { schema, rootValue };
