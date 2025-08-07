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

  executeTabletCells: publicProcedure
    .input(z.object({
      tabletId: z.string(),
      limit: z.number().min(1).max(100).optional()
    }))
    .output(z.array(z.object({ flowJobId: z.string() })))
    .mutation(async ({ input, ctx }) => {
      const { tabletId, limit } = input;
      const userId = getUserId(ctx as Context);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      return bullmqService.executeTabletCells({ tabletId, userId, limit });
    }),

  // Updated SSE subscription for flow progress
  subscribeToTabletProgress: publicProcedure
    .input(z.object({
      tabletId: z.string(),
      flowJobId: z.string(),
      accessJwt: z.string(),
      signal: z.any(),
    }))
    .subscription(async function* (opts) {
      const { tabletId, flowJobId, accessJwt, signal } = opts.input;
      const resources = await unpackAccessToken(accessJwt);
      let jobIds: Set<string> = new Set();
      let completedJobIds: Set<string> = new Set();
      
      while (!signal.aborted) {
        try {
          // Get the flow structure using BullMQ's getFlow method
          const tree = await flowProducer.getFlow({
            id: flowJobId,
            queueName: "taskQueue",
          });

          if (!tree) {
            yield {
              completed: 0,
              total: 0,
              message: 'Flow not found',
              jobIds: [],
              completedJobs: [],
            };
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          // Extract all child job IDs from the flow tree
          const childJobIds: string[] = [];
          
          const extractChildIds = (children: any[]) => {
            for (const child of children) {
              if (child.job?.id) {
                childJobIds.push(child.job.id);
                jobIds.add(child.job.id);
              }
              if (child.children) {
                extractChildIds(child.children);
              }
            }
          };

          if (tree.children) {
            extractChildIds(tree.children);
          }
          
          if (childJobIds.length === 0) {
            yield {
              completed: 0,
              total: 0,
              message: 'No child jobs found',
              jobIds: [],
              completedJobs: [],
            };
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          // Get status for all child jobs
          const childJobStatuses = await Promise.all(
            childJobIds.map(async (jobId: string) => {
              const job = await taskQueue.getJob(jobId);
              if (!job) return null;
              const state = await job.getState();
              if (state === 'completed' || state === 'failed') {
                completedJobIds.add(jobId);
              }
              return { id: jobId, status: state, data: job.data };
            })
          );

          const validJobs = childJobStatuses.filter(job => job !== null);
          const total = validJobs.length;
          
          // Get data for completed jobs
          const completedJobs = [];
          const inProgressJobs: { rowId: string, columnId: string }[] = [];
          for (const job of validJobs) {
            if (job!.status === 'completed') {
              try {
                const { tabletId: jobTabletId, rowId } = job!.data.data;
                const rowData = await bullmqService.getTabletRowData({ 
                  tabletId: jobTabletId, 
                  rowId, 
                  userId: resources.user_id 
                });
                completedJobs.push({
                  jobId: job!.id,
                  rowId,
                  rowData: rowData.data,
                  columnId: job!.data.data.columnId,
                  columnName: job!.data.data.columnName,
                });
              } catch (error) {
                console.error('Error fetching row data for completed job:', error);
                // Still include the job as completed even if we can't fetch the data
                completedJobs.push({
                  jobId: job!.id,
                  rowId: job!.data.data.rowId,
                  rowData: null,
                  columnId: job!.data.data.columnId,
                  columnName: job!.data.data.columnName,
                });
              }
            } else if (job!.status !== 'failed') {
              inProgressJobs.push({
                rowId: job!.data.data.rowId,
                columnId: job!.data.data.columnId,
              });
            }
          }
          
          const message = `${completedJobIds.size} of ${total} tasks completed`;
          
          yield {
            completed: completedJobIds.size,
            total: jobIds.size,
            message,
            jobIds: validJobs.map(job => job!.id),
            completedJobs,
            inProgressJobs,
          };
          
          // Stop polling if all tasks are done
          if (completedJobIds.size >= total && total > 0) {
            break;
          }
          
          // Poll every 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error polling tablet progress:', error);
          yield {
            completed: 0,
            total: 0,
            message: 'Error checking progress',
            jobIds: [],
            completedJobs: [],
            inProgressJobs: [],
          };
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
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