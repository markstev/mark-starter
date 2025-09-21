"use client";

import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useOrganization } from "@clerk/nextjs";
import { Layout } from "@/components/layout/layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Eye, EyeOff, Play, Pause, Link, Copy } from "lucide-react";
import { RlsOrgExample } from "../../../../../packages/db/src/types";
import { toast } from "sonner";

export default function RlsOrgDemoPage() {
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingExampleId, setDeletingExampleId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [newPublicToken, setNewPublicToken] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSseExample, setCurrentSseExample] = useState<RlsOrgExample | null>(null);
  const [publicLinkDialogOpen, setPublicLinkDialogOpen] = useState(false);
  const [generatedPublicLink, setGeneratedPublicLink] = useState<string>("");

  const { data: rlsOrgExamples, isLoading, error } = useQuery({
    ...trpc.rlsOrgDemo.listForOrganization.queryOptions(),
    enabled: isLoaded && !!user?.id && !!organization?.id,
  });

  // Get access token for SSE - now using auth router
  const { data: accessTokenData } = useQuery({
    ...trpc.auth.getAccessToken.queryOptions(),
    enabled: isLoaded && !!user?.id,
  });

  const createMutation = useMutation({
    ...trpc.rlsOrgDemo.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.rlsOrgDemo.listForOrganization.queryKey() });
      setIsCreateDialogOpen(false);
      setNewContent("");
      setNewPublicToken("");
    }
  });

  const deleteMutation = useMutation({
    ...trpc.rlsOrgDemo.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.rlsOrgDemo.listForOrganization.queryKey() });
      setIsDeleteDialogOpen(false);
      setDeletingExampleId(null);
    }
  });

  const updateMutation = useMutation({
    ...trpc.rlsOrgDemo.update.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trpc.rlsOrgDemo.listForOrganization.queryKey() });
      if (data?.publicToken) {
        const publicLink = `${window.location.origin}/public/rls-org-example/${data.publicToken}`;
        setGeneratedPublicLink(publicLink);
        setPublicLinkDialogOpen(true);
      }
    }
  });

  // // SSE Subscription
  // useSubscription(
  //   {
  //     ...trpc.rlsOrgDemo.streamExamples.subscriptionOptions(
  //       { accessJwt: accessTokenData?.accessJwt || "" },
  //       {
  //         onData: (data) => {
  //           if (data.type === 'example' && data.data) {
  //             setCurrentSseExample(data.data);
  //           } else if (data.type === 'error') {
  //             console.error('SSE Error:', data.error);
  //           }
  //         },
  //         enabled: isStreaming && !!accessTokenData?.accessJwt,
  //       }
  //     ),
  //   }
  // );

  const toggleStreaming = () => {
    if (isStreaming) {
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
    }
  };

  const createExample = () => {
    if (!user?.id || !organization?.id || !newContent.trim()) return;
    createMutation.mutate({
      content: newContent.trim(),
      publicToken: newPublicToken.trim() || undefined,
    });
  };

  const handleDeleteClick = (exampleId: string) => {
    setDeletingExampleId(exampleId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingExampleId) return;
    deleteMutation.mutate({ id: deletingExampleId });
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleMakePublicLink = (exampleId: string) => {
    const randomToken = generateRandomToken();
    updateMutation.mutate({
      id: exampleId,
      publicToken: randomToken,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'content', 
      headerName: 'Content', 
      width: 300,
      renderCell: (params) => (
        <div className="max-w-[280px] truncate">
          {params.value}
        </div>
      )
    },
    { 
      field: 'publicToken', 
      headerName: 'Public Access', 
      width: 150,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          {params.value ? (
            <>
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Public</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Private</span>
            </>
          )}
        </div>
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 160,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2 h-full">
          {!params.row.publicToken ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                handleMakePublicLink(params.row.id);
              }}
              disabled={updateMutation.isPending}
            >
              <Link className="h-4 w-4 mr-1" />
              Make Public Link
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                const publicLink = `${window.location.origin}/public/rls-org-example/${params.row.publicToken}`;
                copyToClipboard(publicLink);
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Link
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return (
    <Layout>
      <div className="p-16">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div style={{ height: 400, width: '100%' }}>
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </Layout>
  );
  
  if (error) return (
    <Layout>
      <div>Error loading RLS organization examples</div>
    </Layout>
  );

  if (!organization?.id) {
    return (
      <Layout>
        <div className="p-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Organization Required</h1>
            <p className="text-muted-foreground">
              Please select an organization to view RLS organization examples.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-16">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">RLS Organization Demo</h1>
            <p className="text-muted-foreground">
              Demonstrates Row Level Security at the organization level with organization-owned content and public sharing
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Current Organization: {organization.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isStreaming ? "destructive" : "outline"}
              onClick={toggleStreaming}
              disabled={!accessTokenData?.accessJwt}
            >
              {isStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop SSE
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start SSE
                </>
              )}
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Example
            </Button>
          </div>
        </div>

        {/* SSE Status */}
        {isStreaming && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700">
                {currentSseExample?.content}
              </span>
            </div>
          </div>
        )}
        
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rlsOrgExamples || []}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'default',
              },
            }}
          />
        </div>

        {/* Create Example Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New RLS Organization Example</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Input
                  id="content"
                  placeholder="Enter your content here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      createExample();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="publicToken">Public Token (optional)</Label>
                <Input
                  id="publicToken"
                  placeholder="Leave empty for private content"
                  value={newPublicToken}
                  onChange={(e) => setNewPublicToken(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  If provided, anyone can view this content using the token
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createExample}
                disabled={!newContent.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Example"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Example Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete RLS Organization Example</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this example? This action cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Example"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Public Link Dialog */}
        <Dialog open={publicLinkDialogOpen} onOpenChange={setPublicLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Public Link Created</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Your content is now publicly accessible. Share this link with anyone:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedPublicLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedPublicLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setPublicLinkDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 