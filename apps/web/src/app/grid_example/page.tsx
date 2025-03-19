"use client";

import { DataGridExample } from "@/components/DataGridExample";
import { trpc } from "../../api/client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export default function GridExamplePage() {
  const trpcClient = useTRPC();
  const { data } = useQuery(trpcClient.hello.queryOptions({}));
  //const { data } = trpcClient.hello.useQuery();
//const { data } = useQuery({
//  queryKey: ["hello"],
//  queryFn: () => trpcClient.hello.query(),
//});

  return (
    <main className="container py-6">
      <h1 className="font-heading text-3xl mb-6">Grid Example</h1>
      <DataGridExample />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
} 