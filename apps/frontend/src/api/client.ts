import { hc } from "hono/client";
import { HTTPException } from "hono/http-exception";
import type { AppType } from "@repo/backend/src";
import { getToken } from "@/lib/clerk";
import { createTRPCClient, httpBatchLink, splitLink, loggerLink, wsLink, createWSClient } from '@trpc/client';
import type { AppRouter } from '@repo/backend/src';
import superjson from "superjson";

export type { InferRequestType, InferResponseType } from "hono/client";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL!;
};

export const apiRpc = hc<AppType>(getBaseUrl(), {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, init);
  },
}).api;

export const getApiClient = () => {
  return hc<AppType>(getBaseUrl(), {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const authToken = await getToken();

      headers.set("Authorization", `Bearer ${authToken}`);

      const response = await fetch(input, {
        ...init,
        headers,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new HTTPException(response.status as any, {
          message: "Network response was not ok",
        });
      }

      return response;
    },
  }).api;
};

const getWsUrl = () => {
  const url = process.env.NEXT_PUBLIC_WS_URL!;
  return url.replace(/^http/, 'ws').replace(":3004", ":3005");
};

//     👆 **type-only** import
 
// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
export const trpc = createTRPCClient<AppRouter>({
  links: [
    // This link allows you to see tRPC requests in your browser's console
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    splitLink({
      condition(op) {
        return op.type == "subscription"
      },
      // When condition is true, use the WebSocket link
      true: wsLink({
        client: createWSClient({
          // Ensure this URL is correct and includes the full path
          url: `${getWsUrl()}/api/trpc`,
        }),
        transformer: superjson,
      }),

      // When condition is false, use the HTTP link
      false: httpBatchLink({
        // Ensure this URL is also correct
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        // You can add auth headers here if needed
        // async headers() {
        //   return {
        //     authorization: getAuthToken(),
        //   };
        // },
      }),
    }),
  ],
});
