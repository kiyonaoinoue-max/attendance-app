import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    let ioRedisClient: IORedis | null = null;

    try {
        // 1. Try Upstash REST API (Recommended for Vercel Serverless)
        const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

        if (restUrl && restToken) {
            console.log('Using Upstash Redis REST client for retrieval...');
            const redis = new UpstashRedis({ url: restUrl, token: restToken });
            const dataResult = await redis.get(`sync:${code}`);

            if (!dataResult) {
                return NextResponse.json({ error: 'Invalid code or expired' }, { status: 404 });
            }

            console.log('Data retrieved successfully via Upstash REST');
            let data = dataResult;
            if (typeof dataResult === 'string') {
                try {
                    data = JSON.parse(dataResult);
                } catch {
                    data = dataResult;
                }
            }

            return NextResponse.json({ data });
        }

        // 2. Fallback to standard Redis URL (ioredis)
        const redisUrl = process.env.REDIS_URL || process.env.KV_URL || process.env.KV_REDIS_URL;

        if (!redisUrl) {
            console.error('Missing Redis environment variables (KV_REST_API_URL/REDIS_URL/KV_URL/KV_REDIS_URL)');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log('Connecting via ioredis fallback for retrieval...');
        const isTls = redisUrl.startsWith('rediss://');
        ioRedisClient = new IORedis(redisUrl, isTls ? { tls: { rejectUnauthorized: false } } : {});

        const dataStr = await ioRedisClient.get(`sync:${code}`);

        if (!dataStr) {
            return NextResponse.json({ error: 'Invalid code or expired' }, { status: 404 });
        }

        console.log('Data retrieved successfully via ioredis');
        const data = JSON.parse(dataStr);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Sync retrieve error:', error);
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
