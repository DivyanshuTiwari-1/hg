import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url: redisUrl
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export async function getCache(key: string) {
  const redis = await connectRedis();
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key: string, value: any, expireTime = 3600) {
  const redis = await connectRedis();
  await redis.set(key, JSON.stringify(value), {
    EX: expireTime
  });
}

export async function deleteCache(key: string) {
  const redis = await connectRedis();
  await redis.del(key);
}

export default connectRedis; 