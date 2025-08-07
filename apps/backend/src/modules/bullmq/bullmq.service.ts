import { taskQueue } from "../../workers/task.worker";
import { logger } from "@repo/logs";

export const bullmqService = {
  async addTask({ taskType, data }: { taskType: string; data?: any }) {
    try {
      const job = await taskQueue.add(taskType, { taskType, data });
      logger.info(`Added task ${taskType} with job ID: ${job.id}`);
      if (!job.id) {
        throw new Error('Failed to create job');
      }
      return { jobId: job.id };
    } catch (error) {
      logger.error("Failed to add task:", error);
      throw error;
    }
  },

  async getTaskStatus(jobId: string) {
    try {
      const job = await taskQueue.getJob(jobId);
      
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const state = await job.getState();
      const result = await job.returnvalue;
      
      return {
        id: job.id!,
        data: job.data,
        status: state,
        result: result || null,
        createdAt: job.timestamp ? new Date(job.timestamp) : new Date(),
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      };
    } catch (error) {
      logger.error(`Failed to get task status for ${jobId}:`, error);
      throw error;
    }
  },

  async listTasks({ limit, offset }: { limit: number; offset: number }) {
    try {
      const jobs = await taskQueue.getJobs(['completed', 'failed', 'waiting', 'active'], offset, offset + limit - 1);
      
      return await Promise.all(
        jobs.map(async (job) => {
          const state = await job.getState();
          const result = await job.returnvalue;
          
          return {
            id: job.id!,
            data: job.data,
            status: state,
            result: result || null,
            createdAt: job.timestamp ? new Date(job.timestamp) : new Date(),
            completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
          };
        })
      );
    } catch (error) {
      logger.error("Failed to list tasks:", error);
      throw error;
    }
  },

}; 