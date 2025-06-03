'use client';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function DataGridExample() {
  const trpcClient = useTRPC();
  const { data: rows, isLoading, error } = useQuery(
    trpcClient.grid.list.queryOptions()
  );

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleHeaderClick = (columnField: string) => {
    setSelectedColumn(columnField);
    setSidebarOpen(true);
  };

  const createClickableHeader = (field: string) => (params: any) => (
    <div 
      onClick={() => handleHeaderClick(field)}
      className="cursor-pointer font-bold"
    >
      {params.colDef.headerName}
    </div>
  );

  const baseColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'firstName', headerName: 'First name', width: 130 },
    { field: 'lastName', headerName: 'Last name', width: 130 },
    { field: 'age', headerName: 'Age', type: 'number', width: 90 },
  ];

  const columns = baseColumns.map(col => ({
    ...col,
    renderHeader: createClickableHeader(col.field)
  }));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading grid data</div>;

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="relative h-96 w-full">
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

        <Sidebar side="right" variant="floating">
          <SidebarHeader>
            <h2 className="text-lg font-bold">Column Configuration</h2>
          </SidebarHeader>
          
          {selectedColumn && (
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Selected Column</SidebarGroupLabel>
                <SidebarGroupContent>
                  {selectedColumn}
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Configuration Options</SidebarGroupLabel>
                <SidebarGroupContent>
                  <ul className="space-y-1">
                    <li>• Column width settings</li>
                    <li>• Sort configuration</li>
                    <li>• Filter options</li>
                    <li>• Display preferences</li>
                  </ul>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Column Details</SidebarGroupLabel>
                <SidebarGroupContent>
                  <p>Field: {selectedColumn}</p>
                  <p>Type: {selectedColumn === 'age' ? 'number' : 'string'}</p>
                  <p>Sortable: Yes</p>
                  <p>Filterable: Yes</p>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          )}

          <SidebarFooter>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm">Hide Column</Button>
              <Button variant="secondary" size="sm">Reset Settings</Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
} 