import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const isTls = REDIS_URL.startsWith('rediss://');

export const redisClient = createClient({
  url: REDIS_URL,
  ...(isTls && { socket: { tls: true as const, rejectUnauthorized: false } }),
});

export const redisSubscriber = redisClient.duplicate();

redisClient.on('error', (err: Error) => console.error('[Redis] client error:', err));
redisSubscriber.on('error', (err: Error) => console.error('[Redis] subscriber error:', err));

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
  await redisSubscriber.connect();
  console.log('[Redis] connected');
}
