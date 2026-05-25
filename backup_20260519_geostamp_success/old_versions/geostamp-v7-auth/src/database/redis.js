const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;

const connectRedis = async () => {
    redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Redis connection retries exceeded');
                    return new Error('Redis connection retries exceeded');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    redisClient.on('connect', () => {
        console.log('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
        console.error('❌ Redis error:', err);
    });

    await redisClient.connect();
    return redisClient;
};

const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis not connected. Call connectRedis() first.');
    }
    return redisClient;
};

const setRefreshToken = async (userId, token, expiresInDays = 30) => {
    const client = getRedisClient();
    const key = `refresh_token:${userId}`;
    const expiresInSeconds = expiresInDays * 24 * 60 * 60;
    await client.setEx(key, expiresInSeconds, token);
};

const getRefreshToken = async (userId) => {
    const client = getRedisClient();
    const key = `refresh_token:${userId}`;
    return await client.get(key);
};

const deleteRefreshToken = async (userId) => {
    const client = getRedisClient();
    const key = `refresh_token:${userId}`;
    await client.del(key);
};

const setRateLimit = async (key, windowMs, maxRequests) => {
    const client = getRedisClient();
    const current = await client.incr(key);
    if (current === 1) {
        await client.pExpire(key, windowMs);
    }
    return {
        current,
        remaining: Math.max(0, maxRequests - current),
        reset: Date.now() + windowMs
    };
};

module.exports = {
    connectRedis,
    getRedisClient,
    setRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    setRateLimit
};
