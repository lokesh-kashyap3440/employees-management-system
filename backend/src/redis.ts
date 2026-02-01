import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url: redisUrl
});

client.on('error', (err) => console.error('Redis Client Error', err));

let isConnecting = false;

export const connectRedis = async () => {
  if (client.isOpen) return;
  if (isConnecting) return;

  isConnecting = true;
  try {
    await client.connect();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
  } finally {
    isConnecting = false;
  }
};

export const getRedisClient = () => client;

export const pushNotification = async (notification: any) => {
  try {
    await connectRedis();
    if (!client.isOpen) return;
    // We'll store notifications in a list for admins
    await client.lPush('admin_notifications', JSON.stringify(notification));
    // Keep only the last 100 notifications
    await client.lTrim('admin_notifications', 0, 99);
  } catch (error) {
    console.error('Error pushing notification to Redis:', error);
  }
};

export const getNotifications = async () => {
  try {
    await connectRedis();
    if (!client.isOpen) return [];
    const notifications = await client.lRange('admin_notifications', 0, -1);
    return notifications.map(n => JSON.parse(n));
  } catch (error) {
    console.error('Error getting notifications from Redis:', error);
    return [];
  }
};

export const clearNotifications = async () => {
  try {
    await connectRedis();
    if (!client.isOpen) return;
    await client.del('admin_notifications');
  } catch (error) {
    console.error('Error clearing notifications from Redis:', error);
  }
};

// Generic caching helpers
export const setCache = async (key: string, value: any, ttlSeconds = 3600) => {
  try {
    await connectRedis();
    if (!client.isOpen) return;
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
};

export const getCache = async (key: string) => {
  try {
    await connectRedis();
    if (!client.isOpen) return null;
    const cachedValue = await client.get(key);
    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

export const deleteCache = async (key: string) => {
  try {
    await connectRedis();
    if (!client.isOpen) return;
    await client.del(key);
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
  }
};

export const deletePattern = async (pattern: string) => {
  try {
    await connectRedis();
    if (!client.isOpen) return;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error(`Error deleting keys with pattern ${pattern}:`, error);
  }
};
