"use client";

import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: tenants, isLoading, error } = useQuery(trpc.tenants.list.queryOptions());
  
  const createMutation = useMutation({
    ...trpc.tenants.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.tenants.list.queryKey() });
    }
  });

  const updateMutation = useMutation({
    ...trpc.tenants.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.tenants.list.queryKey() });
    }
  });

  const deleteMutation = useMutation({
    ...trpc.tenants.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.tenants.list.queryKey() });
    }
  });

  const createTenant = () => createMutation.mutate({ name: "New Tenant" });
  const updateTenant = () => {
    if (!editingTenant) return;
    updateMutation.mutate({ id: editingTenant.id, name: newName });
    setEditingTenant(null);
  };
  const deleteTenant = (id: string) => deleteMutation.mutate({ id });

  const [editingTenant, setEditingTenant] = useState<{ id: string, name: string } | null>(null);
  const [newName, setNewName] = useState("");

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 130 },
    { field: 'createdAt', headerName: 'Created At', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              setEditingTenant(params.row);
              setNewName(params.row.name);
            }}
          >
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => deleteTenant(params.row.id)}>Delete</Button>
        </>
      ),
    },
  ];

  if (isLoading) return (
    <div className="p-16">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
  if (error) return <div>Error loading tenants</div>;

  return (
    <div className="p-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Button onClick={createTenant}>Add Tenant</Button>
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={tenants}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <Dialog open={editingTenant !== null} onOpenChange={(open) => !open && setEditingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setEditingTenant(null)}>
                Cancel
              </Button>
              <Button onClick={updateTenant}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 