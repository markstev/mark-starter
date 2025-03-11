import { getApiClient } from './client';
import { useQuery } from "@tanstack/react-query";

export async function getGridData() {
  const client = getApiClient();
  const response = await client.grid.$get();
  return response.json();
}

export function useGridData() {
  return useQuery({
    queryKey: ['grid-data'],
    queryFn: getGridData
  });
} 