// src/utils/api.ts
import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/client";
import appRouter, { AppRouter } from "../../../api/src/core/server";
import { createNextApiHandler } from "@trpc/server/adapters/next";

const getBaseUrl = () => {
  return `${window.location.protocol}//${window.location.host}`;
};

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
});

export default createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
});

export type ApiType = typeof api;