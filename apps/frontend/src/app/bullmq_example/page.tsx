"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  data?: any;
  status: "waiting" | "active" | "completed" | "failed" | "delayed" | "paused";
  result?: any;
  createdAt: Date;
  completedAt?: Date;
}

export default function BullMQExamplePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());

  // Query for listing tasks
  const { data: tasks = [], isLoading, refetch } = useQuery(trpc.bullmq.listTasks.queryOptions({ limit: 50, offset: 0 }));

  // Mutation for adding tasks
  const addTaskMutation = useMutation({
    ...trpc.bullmq.addTask.mutationOptions(),
    onSuccess: (data) => {
      toast.success(`Task added! Job ID: ${data.jobId}`);
      setActiveJobs(prev => new Set([...prev, data.jobId]));
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add task: ${error.message}`);
    }
  });

  // Function to add a random number task
  const addRandomNumberTask = () => {
    addTaskMutation.mutate({ taskType: "randomNumber" });
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "active":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "active":
        return <Badge variant="secondary" className="bg-blue-500">Active</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BullMQ Work Queue Example</h1>
          <p className="text-muted-foreground mt-2">
            Add tasks to the queue and monitor their progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={addRandomNumberTask}
            disabled={addTaskMutation.isPending}
            className="flex items-center gap-2"
          >
            {addTaskMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Add Random Number Task
          </Button>
          <Button 
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Task Queue
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {tasks.length} tasks in the queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks in the queue. Add a task to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task: Task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <div className="font-medium">Job {task.id}</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(task.createdAt).toLocaleString()}
                        {task.completedAt && (
                          <span className="ml-2">
                            • Completed: {new Date(task.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {task.status === "completed" && task.result && (
                      <div className="text-sm">
                        Result: <span className="font-mono bg-muted px-2 py-1 rounded">
                          {JSON.stringify(task.result)}
                        </span>
                      </div>
                    )}
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Adding Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Click "Add Random Number Task" to add a new job to the queue. The task will simulate 
              some work (2 seconds delay) and then generate a random number.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Task Processing</h3>
            <p className="text-sm text-muted-foreground">
              The BullMQ worker processes tasks in the background. You can see the status change 
              from "Pending" to "Active" to "Completed" or "Failed".
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Use the "Refresh" button to update the task list and see the latest status and results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
