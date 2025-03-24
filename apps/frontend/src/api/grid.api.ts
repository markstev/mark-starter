import { getApiClient } from './client';

export async function getGridData() {
  const client = getApiClient();
  const response = await client.grid.$get();
  return response.json();
}
