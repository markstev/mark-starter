import { DataGridExample } from "@/components/DataGridExample";
import { trpc } from "../../api/client";

export default function GridExamplePage() {
  trpc.hello.query();

  return (
    <main className="container py-6">
      <h1 className="font-heading text-3xl mb-6">Grid Example</h1>
      <DataGridExample />
    </main>
  );
} 