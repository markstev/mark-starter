'use client';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from 'react';

export function DataGridExample() {
  const trpcClient = useTRPC();
  const { data: rows, isLoading, error } = useQuery(
    trpcClient.grid.list.queryOptions()
  );

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleHeaderClick = (columnField: string) => {
    setSelectedColumn(columnField);
    setIsPanelOpen(true);
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

  const columns: GridColDef[] = baseColumns.map(col => ({
    ...col,
    renderHeader: createClickableHeader(col.field)
  }));

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedColumn(null);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading grid data</div>;

  return (
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
      
      {/* Right Panel */}
      <div
        className={`fixed top-0 w-96 h-screen bg-white shadow-lg transition-all duration-300 ease-in-out z-[1000] p-5 border-l border-gray-200 overflow-auto ${
          isPanelOpen ? 'right-0' : '-right-96'
        }`}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-lg font-bold">
            Column Configuration
          </h2>
          <button
            onClick={handleClosePanel}
            className="bg-transparent border-none text-xl cursor-pointer p-1 hover:bg-gray-100 rounded"
          >
            ×
          </button>
        </div>
        
        {selectedColumn && (
          <div>
            <h3 className="text-base mb-2.5">
              Selected Column: {selectedColumn}
            </h3>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Configuration Options</h4>
              <p className="mb-1">• Column width settings</p>
              <p className="mb-1">• Sort configuration</p>
              <p className="mb-1">• Filter options</p>
              <p className="mb-1">• Display preferences</p>
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Column Details</h4>
              <p className="mb-1">Field: {selectedColumn}</p>
              <p className="mb-1">Type: {selectedColumn === 'age' ? 'number' : 'string'}</p>
              <p className="mb-1">Sortable: Yes</p>
              <p className="mb-1">Filterable: Yes</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Actions</h4>
              <button className="mr-2.5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Hide Column
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Reset Settings
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay */}
      {isPanelOpen && (
        <div
          onClick={handleClosePanel}
          className="fixed top-0 left-0 w-screen h-screen bg-black opacity-20 z-[999]"
        />
      )}
    </div>
  );
} 