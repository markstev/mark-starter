"use client";

import { useSubscription } from "@trpc/tanstack-react-query";
import { useTRPC } from "@/utils/trpc";

export default function SSEDemo() {
  const trpc = useTRPC();
  const { data: randomNumber } = useSubscription(trpc.randomNumber.subscriptionOptions(
    undefined,
    {
      enabled: true,
    }
  ));

  const { data: sseData } = useSubscription(trpc.sseExample.sse.subscriptionOptions(
    {
        signal: new AbortController().signal,
    },
    {
      enabled: true,
    }
  ));

  return (
    <main className="flex flex-1 items-center justify-center">
      {/* Hero Section */}
      <section className="space-y-6 pt-6 pb-8 md:pt-10 md:pb-12 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            SSE Demo
          </h1>
          <div>RNG: {randomNumber}</div>
          <div>Custom Router: {sseData}</div>
        </div>
      </section>
    </main>
  );
}
