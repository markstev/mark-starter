import { api } from "@/api/trpc";

export default function TenantsPage() {
  const { data, isLoading, error } = api.getTenants.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>Loaded!</div>
  );
}
