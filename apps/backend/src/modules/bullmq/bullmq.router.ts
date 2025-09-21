import { Context } from "hono";
import { getUserId } from "@/pkg/middleware/clerk-auth";
import { publicProcedure, router } from "../../trpc";
import { bullmqService } from "./bullmq.service";
import { z } from "zod";
import { Job, QueueEvents } from "bullmq";
import { taskQueue, flowProducer } from "../../workers/task.worker";
import { unpackAccessToken } from "../auth/socket_auth";

const TaskSchema = z.object({
  id: z.string(),
  data: z.any().optional(),
  status: z.enum(["waiting", "active", "completed", "failed", "delayed", "paused"]),
  result: z.any().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

const PendingTasksSchema = z.object({
  pendingCount: z.number(),
  totalJobs: z.number(),
  jobs: z.array(z.object({
    id: z.string(),
    status: z.string(),
    data: z.any(),
  })),
});

const TaskProgressSchema = z.object({
  completed: z.number(),
  total: z.number(),
  message: z.string(),
  jobIds: z.array(z.string()),
  completedJobs: z.array(z.object({
    jobId: z.string(),
    rowId: z.string(),
    rowData: z.any().nullable(),
    columnId: z.string(),
    columnName: z.string(),
  })),
});

export const bullmqRouter = router({
  addTask: publicProcedure
    .input(z.object({ 
      taskType: z.enum(["randomNumber", "executeLlmForCell"]),
      data: z.any().optional()
    }))
    .output(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      return bullmqService.addTask(input);
    }),

  getTaskStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .output(TaskSchema)
    .query(async ({ input }) => {
      return bullmqService.getTaskStatus(input.jobId);
    }),

  listTasks: publicProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }))
    .output(z.array(TaskSchema))
    .query(async ({ input }) => {
      return bullmqService.listTasks(input);
    }),


  // Simple SSE subscription for task progress by jobIds
  subscribeToJobProgress: publicProcedure
    .input(z.object({
      jobIds: z.array(z.string()),
      signal: z.any(),
    }))
    .subscription(async function* (opts) {
      const { jobIds, signal } = opts.input;
      
      while (!signal.aborted) {
        try {
          // Get status for all specified jobs
          const jobStatuses = await Promise.all(
            jobIds.map(jobId => bullmqService.getTaskStatus(jobId))
          );
          
          // Count completed vs total
          const total = jobStatuses.length;
          const completed = jobStatuses.filter(job => 
            job.status === 'completed' || job.status === 'failed'
          ).length;
          
          const message = `${completed} of ${total} tasks completed`;
          
          yield {
            completed,
            total,
            message,
            jobIds,
          };
          
          // Stop polling if all tasks are done
          if (completed >= total && total > 0) {
            break;
          }
          
          // Poll every 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error polling job progress:', error);
          yield {
            completed: 0,
            total: 0,
            message: 'Error checking progress',
            jobIds,
          };
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }),
}); 