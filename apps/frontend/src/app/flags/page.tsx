"use client";

import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type FlagState = {
  id: string;
  name: string;
  description: string;
  defaultState: boolean;
  organizationOverride: boolean | null;
  userOverride: boolean | null;
  effectiveState: boolean;
};

export default function FeatureFlagsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState("");
  const [userId, setUserId] = useState("");

  // Get flag states (works with or without organizationId)
  const { data: flagStates, isLoading: statesLoading, refetch: refetchStates } = useQuery({
    ...trpc.featureFlags.getFlagState.queryOptions({ 
      organizationId: organizationId || undefined,
      userId: userId || undefined
    }),
  });

  // Mutations
  const setFlagMutation = useMutation({
    ...trpc.featureFlags.setFlag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: trpc.featureFlags.getFlagState.queryKey({ 
          organizationId: organizationId || undefined,
          userId: userId || undefined
        }) 
      });
      toast.success("Flag updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update flag: ${error.message}`);
    }
  });

  const removeUserFlagMutation = useMutation({
    ...trpc.featureFlags.removeUserFlag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: trpc.featureFlags.getFlagState.queryKey({ 
          organizationId: organizationId || undefined,
          userId: userId || undefined
        }) 
      });
      toast.success("User flag removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove user flag: ${error.message}`);
    }
  });

  const removeOrganizationFlagMutation = useMutation({
    ...trpc.featureFlags.removeOrganizationFlag.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: trpc.featureFlags.getFlagState.queryKey({ 
          organizationId: organizationId || undefined,
          userId: userId || undefined
        }) 
      });
      toast.success("Organization flag removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove organization flag: ${error.message}`);
    }
  });

  const handleFlagToggle = (flagId: string, level: "default" | "organization" | "user", enabled: boolean) => {
    if (level === "default") {
      setFlagMutation.mutate({
        flagId,
        enabled,
        level: "default"
      });
    } else if (level === "organization") {
      if (!organizationId) {
        toast.error("Please enter an organization ID first");
        return;
      }
      setFlagMutation.mutate({
        flagId,
        enabled,
        level: "organization",
        organizationId
      });
    } else if (level === "user") {
      if (!userId) {
        toast.error("Please enter a user ID first");
        return;
      }
      setFlagMutation.mutate({
        flagId,
        enabled,
        level: "user",
        userId
      });
    }
  };

  const handleRemoveFlag = (flagId: string, level: "organization" | "user") => {
    if (level === "organization") {
      if (!organizationId) {
        toast.error("Please enter an organization ID first");
        return;
      }
      removeOrganizationFlagMutation.mutate({
        flagId,
        organizationId
      });
    } else if (level === "user") {
      if (!userId) {
        toast.error("Please enter a user ID first");
        return;
      }
      removeUserFlagMutation.mutate({
        flagId,
        userId
      });
    }
  };

  const getToggleState = (flagState: FlagState, level: "default" | "organization" | "user") => {
    switch (level) {
      case "default":
        return flagState.defaultState;
      case "organization":
        return flagState.organizationOverride ?? false;
      case "user":
        return flagState.userOverride ?? false;
      default:
        return false;
    }
  };

  const hasOverride = (flagState: FlagState, level: "organization" | "user") => {
    return level === "organization" ? flagState.organizationOverride !== null : flagState.userOverride !== null;
  };

  if (statesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feature Flags Management</h1>
      </div>

      {/* Organization and User ID Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgId">Organization ID</Label>
              <Input
                id="orgId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="Enter organization ID"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Enter organization ID to manage organization-level overrides
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Enter user ID to manage user-level overrides
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Effective State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flagStates?.map((flagState) => (
                <TableRow key={flagState.id}>
                  <TableCell className="font-medium">{flagState.name}</TableCell>
                  <TableCell className="text-muted-foreground">{flagState.description}</TableCell>
                  
                  {/* Default State */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={flagState.defaultState}
                        onCheckedChange={(enabled) => handleFlagToggle(flagState.id, "default", enabled)}
                      />
                    </div>
                  </TableCell>

                  {/* Organization Override */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={getToggleState(flagState, "organization")}
                        onCheckedChange={(enabled) => handleFlagToggle(flagState.id, "organization", enabled)}
                        disabled={!organizationId}
                      />
                      {hasOverride(flagState, "organization") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFlag(flagState.id, "organization")}
                          disabled={!organizationId}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  {/* User Override */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={getToggleState(flagState, "user")}
                        onCheckedChange={(enabled) => handleFlagToggle(flagState.id, "user", enabled)}
                        disabled={!userId}
                      />
                      {hasOverride(flagState, "user") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFlag(flagState.id, "user")}
                          disabled={!userId}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  {/* Effective State */}
                  <TableCell>
                    <Badge variant={flagState.effectiveState ? "default" : "secondary"}>
                      {flagState.effectiveState ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

