import { Hono } from "hono";
import { cors } from "hono/cors";
import { publicProcedure, router } from "./trpc";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { postRoutes } from "@/modules/posts";
import { gridRouter } from "./modules/grid/grid.routes";

import { logger } from "hono/logger";
import { errorHandler } from "@/pkg/middleware/error";
import { webhookRoutes } from "@/modules/webhooks/webhook.routes";
import { tenantsRouter } from "./modules/tenants/tenants.router";

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
});

app.all('/api/trpc/*', async (c) => {
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  });
  return res;
});

const routes = app
  .basePath("/api")
  .use("*", errorHandler())
  .route("/webhooks", webhookRoutes)
  .route("/posts", postRoutes)

export type AppType = typeof routes;

export default {
  port: 3004,
  fetch: app.fetch,
  idleTimeout: 30,
};

export type AppRouter = typeof appRouter;
