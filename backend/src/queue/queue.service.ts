import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private workerClient: Redis | null = null;
  private isRedisQueueActive = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(private cacheService: CacheService) {}

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;

    try {
      this.workerClient = new Redis({
        host,
        port,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 1) return null;
          return 500;
        }
      });

      this.workerClient.on('connect', () => {
        this.logger.log(`Queue Worker connected to Redis.`);
        this.isRedisQueueActive = true;
        this.startWorkerPoll();
      });

      this.workerClient.on('error', () => {
        this.isRedisQueueActive = false;
      });

      await this.workerClient.connect().catch(() => {
        this.isRedisQueueActive = false;
      });
    } catch (err) {
      this.isRedisQueueActive = false;
    }
  }

  async queueNotification(userId: string, type: string, message: string) {
    const job = {
      userId,
      type,
      message,
      timestamp: Date.now(),
    };

    if (this.isRedisQueueActive && this.workerClient) {
      try {
        await this.workerClient.rpush('notification_queue', JSON.stringify(job));
        this.logger.log(`Job queued on Redis (notification_queue): ${type}`);
        return;
      } catch (err) {
        this.logger.warn(`Failed to push job to Redis queue: ${err.message}. Processing in-memory.`);
      }
    }

    // Fallback to in-memory asynchronous processing
    this.logger.log(`Processing job in-memory: ${type}`);
    setTimeout(() => {
      this.processJob(job);
    }, 500);
  }

  private startWorkerPoll() {
    this.pollingInterval = setInterval(async () => {
      if (!this.isRedisQueueActive || !this.workerClient) return;

      try {
        const jobStr = await this.workerClient.lpop('notification_queue');
        if (jobStr) {
          const job = JSON.parse(jobStr);
          this.logger.log(`Worker picked up job from Redis queue: ${job.type}`);
          this.processJob(job);
        }
      } catch (err) {
        this.logger.warn(`Error polling Redis queue: ${err.message}`);
      }
    }, 3000);
  }

  private processJob(job: any) {
    // Process notification simulation
    this.logger.log(`[WORKER SUCCESS] Dispatching notification for User ${job.userId} - "${job.message}"`);
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.workerClient) {
      this.workerClient.disconnect();
    }
  }
}
