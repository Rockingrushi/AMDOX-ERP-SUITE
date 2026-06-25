import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expiresAt: number | null }>();
  private isRedisAvailable = false;

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;

    this.logger.log(`Attempting to connect to Redis at ${host}:${port}...`);

    try {
      this.redisClient = new Redis({
        host,
        port,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          // Do not retry indefinitely to prevent flooding console with connection errors
          if (times > 1) {
            this.logger.warn(`Redis connection retry limit reached. Falling back to in-memory cache.`);
            return null; 
          }
          return 500;
        }
      });

      this.redisClient.on('error', (err) => {
        if (this.isRedisAvailable) {
          this.logger.warn(`Redis encountered an error: ${err.message}. Switching to in-memory fallback.`);
          this.isRedisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log(`Successfully connected to Redis at ${host}:${port}.`);
        this.isRedisAvailable = true;
      });

      // Trigger lazy connect
      await this.redisClient.connect().catch(() => {
        // Handled silently, triggers retryStrategy -> fallback
        this.isRedisAvailable = false;
      });
    } catch (error) {
      this.logger.warn(`Failed to initialize Redis client. Falling back to in-memory cache.`);
      this.isRedisAvailable = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        return val ? (JSON.parse(val) as T) : null;
      } catch (err) {
        this.logger.warn(`Failed to fetch key "${key}" from Redis: ${err.message}`);
      }
    }

    // In-memory fallback
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        if (ttlSeconds) {
          await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, serialized);
        }
        return;
      } catch (err) {
        this.logger.warn(`Failed to set key "${key}" in Redis: ${err.message}`);
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (err) {
        this.logger.warn(`Failed to delete key "${key}" from Redis: ${err.message}`);
      }
    }

    // In-memory fallback
    this.memoryCache.delete(key);
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }
}
