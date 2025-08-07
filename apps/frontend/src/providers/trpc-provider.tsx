"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from '@trpc/client';
import { useState } from 'react';
import { TRPCProvider } from '../utils/trpc';
import type { AppRouter } from '../../../backend/src/index';
import superjson from 'superjson';
import { getToken } from '@/lib/clerk';

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL!;
};

const getWsUrl = () => {
  const url = process.env.NEXT_PUBLIC_WS_URL!;
  return url.replace(/^http/, 'ws').replace(":3004", ":3005");
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function TRPCProviderWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition(op) {
            return op.type === 'subscription';
          },
          true: wsLink({
            client: createWSClient({
              url: getWsUrl(),
            }),
            transformer: superjson,
          }),
          false: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: superjson,
            headers: async () => {
              const token = await getToken();
              return {
                Authorization: token ? `Bearer ${token}` : '',
              };
            },
          }),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
} 
