import { Queue, Worker, Job, FlowProducer } from "bullmq";
import { logger } from "@repo/logs";

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

// Create the main queue
export const taskQueue = new Queue("taskQueue", {
  connection: redisConfig,
});

// Create FlowProducer for managing job flows
export const flowProducer = new FlowProducer({
  connection: redisConfig,
});



// Task types and their handlers
const taskHandlers = {
  randomNumber: async (job: Job) => {
    logger.info(`Processing random number task ${job.id}`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const randomNumber = Math.floor(Math.random() * 1000);
    logger.info(`Generated random number: ${randomNumber}`);
    
    return { 
      randomNumber,
      timestamp: new Date().toISOString(),
      jobId: job.id 
    };
  },

};

// Create worker to process jobs
const worker = new Worker("taskQueue", async (job) => {
  const { taskType, data } = job.data;
  
  console.log("taskType", taskType);
  const handler = taskHandlers[taskType as keyof typeof taskHandlers];
  if (!handler) {
    throw new Error(`Unknown task type: ${taskType}`);
  }
  console.log("handler", handler);
  
  return await handler(job);
}, {
  connection: redisConfig,
  //concurrency: 1, // Process one task at a time for sequential processing
});

// Handle worker events
worker.on("completed", (job: Job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job?: Job, err?: Error) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker...');
  await worker.close();
  process.exit(0);
});

logger.info('Task worker started'); 