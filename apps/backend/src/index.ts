import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { publicProcedure, router } from "./trpc";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { observable } from "@trpc/server/observable";
import { auth, getAuth } from "./pkg/middleware/clerk-auth";

import { postRoutes } from "@/modules/posts";
import { gridRouter } from "./modules/grid/grid.routes";

import { logger } from "hono/logger";
import { errorHandler } from "@/pkg/middleware/error";
import { webhookRoutes } from "@/modules/webhooks/webhook.routes";
import { tenantsRouter } from "./modules/tenants/tenants.router";
import { bullmqRouter } from "./modules/bullmq/bullmq.router";
import { sseExampleRouter } from "./modules/sse_example/sse_example.router";
import { featureFlagsRouter } from "./modules/featureFlags/featureFlags.router";
import { rlsDemoRouter } from "./modules/rls_demo/rlsDemo.router";
import { authRouter } from "./modules/auth/auth.router";
import { rlsOrgDemoRouter } from "./modules/rls_org_demo/rlsOrgDemo.router";
import { executeGraphQLQuery, executeGraphQLSubscription } from "./modules/graphql_demo/graphql_demo";
import { executeRlsExampleGraphQLQuery, executeRlsExampleGraphQLSubscription } from "./modules/graphql_demo/rls_demo";
import { getUserId } from "./pkg/middleware/clerk-auth";
import { streamText } from 'hono/streaming';

const app = new Hono();

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],  // TODO: Add your vercel path!
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/health", (c) => {
  return c.text("OK");
});


const appRouter = router({
  hello: publicProcedure.query(() => {
    return "Hello, world!";
  }),
  tenants: tenantsRouter,
  grid: gridRouter,
  bullmq: bullmqRouter,
  sseExample: sseExampleRouter,
  featureFlags: featureFlagsRouter,
  rlsDemo: rlsDemoRouter,
  rlsOrgDemo: rlsOrgDemoRouter,
  auth: authRouter,
  // Add a subscription example for WebSocket testing
  randomNumber: publicProcedure.subscription(() => {
    return observable<number>((emit) => {
      const int = setInterval(() => {
        emit.next(Math.random());
      }, 500);
      return () => {
        clearInterval(int);
      };
    });
  }),
});

app.all('/api/trpc/*', auth(), async (c: Context) => {
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({
      ...c,
      req: c.req.raw,
      auth: getAuth(c),
    }),
  });
  return res;
});

// Add GraphQL endpoint
app.post('/api/graphql', async (c) => {
  try {
    const { query, variables } = await c.req.json();
    const result = await executeGraphQLQuery(query, variables);
    return c.json(result);
  } catch (error) {
    return c.json({ errors: [{ message: 'GraphQL execution failed', details: error }] }, 500);
  }
});

// Add RLS Example GraphQL endpoint with authentication
app.post('/api/graphql/rls', auth(), async (c) => {
  try {
    const { query, variables } = await c.req.json();
    const userId = getUserId(c);
    const result = await executeRlsExampleGraphQLQuery(query, variables, userId);
    return c.json(result);
  } catch (error) {
    return c.json({ errors: [{ message: 'RLS GraphQL execution failed', details: error }] }, 500);
  }
});

// Add RLS Example GraphQL subscription endpoint (Server-Sent Events)
app.get('/api/graphql/rls/stream', auth(), async (c) => {
  const { query, variables } = c.req.query();
  
  if (!query) {
    return c.json({ error: 'Query parameter is required' }, 400);
  }

  try {
    const result = await executeGraphQLSubscription(query as string, variables ? JSON.parse(variables as string) : {});
    
    if (!result || typeof result[Symbol.asyncIterator] !== 'function') {
      return c.json({ error: 'Not a subscription query' }, 400);
    }

    // Set up Server-Sent Events
    return streamText(c, async (stream) => {
      try {
        for await (const value of result as AsyncIterable<any>) {
          await stream.write(`data: ${JSON.stringify(value)}\n\n`);
        }
      } catch (error) {
        await stream.write(`data: ${JSON.stringify({ errors: [{ message: 'Subscription error', details: error }] })}\n\n`);
      }
    });
  } catch (error) {
    return c.json({ errors: [{ message: 'Subscription setup failed', details: error }] }, 500);
  }
});

const routes = app
  .basePath("/api")
  .use("*", errorHandler())
  .route("/webhook", webhookRoutes)
  .route("/posts", postRoutes)

export type AppType = typeof routes;

// WebSocket server for TRPC subscriptions
const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;
if ((process.env.WS_ENABLED ?? 'false') === 'true') {
  const wss = new WebSocketServer({ port });
  applyWSSHandler({ wss, router: appRouter, createContext: () => ({}) });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    wss.close();
    process.exit(0);
  });
  console.log(`🔗 tRPC WebSocket endpoint ready at ws://localhost:${port}/`);
}

export default {
  port: 3004,
  fetch: app.fetch,
  idleTimeout: 30,
};

export type AppRouter = typeof appRouter;
