import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    let ioRedisClient: IORedis | null = null;

    try {
        const { data } = await request.json();
        if (!data) {
            return NextResponse.json({ error: 'Data is required' }, { status: 400 });
        }

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 1. Try Upstash REST API (Recommended for Vercel Serverless)
        const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

        if (restUrl && restToken) {
            console.log('Using Upstash Redis REST client...');
            const redis = new UpstashRedis({ url: restUrl, token: restToken });
            await redis.set(`sync:${code}`, JSON.stringify(data), { ex: 600 });
            console.log('Data stored successfully via Upstash REST with code:', code);
            return NextResponse.json({ code, expiresIn: 600 });
        }

        // 2. Fallback to standard Redis URL (ioredis)
        const redisUrl = process.env.REDIS_URL || process.env.KV_URL || process.env.KV_REDIS_URL;

        if (!redisUrl) {
            console.error('Missing Redis environment variables (KV_REST_API_URL/REDIS_URL/KV_URL/KV_REDIS_URL)');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log('Connecting via ioredis fallback...');
        const isTls = redisUrl.startsWith('rediss://');
        ioRedisClient = new IORedis(redisUrl, isTls ? { tls: { rejectUnauthorized: false } } : {});

        // Store with 10 minutes expiration (600 seconds)
        await ioRedisClient.set(`sync:${code}`, JSON.stringify(data), 'EX', 600);
        console.log('Data stored successfully via ioredis with code:', code);

        return NextResponse.json({ code, expiresIn: 600 });
    } catch (error) {
        console.error('Sync store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (ioRedisClient) {
            try {
                await ioRedisClient.quit();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}
