'use client';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function DataGridExample() {
  const trpcClient = useTRPC();
  const { data: rows, isLoading, error } = useQuery(
    trpcClient.grid.list.queryOptions()
  );

  const columns: GridColDef[] = [
    // Define your columns based on the grid data structure
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'firstName', headerName: 'First name', width: 130 },
    { field: 'lastName', headerName: 'Last name', width: 130 },
    { field: 'age', headerName: 'Age', type: 'number', width: 90 },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading grid data</div>;

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows ?? []}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        pageSizeOptions={[5, 10]}
      />
    </div>
  );
} 