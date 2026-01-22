import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    let redis: Redis | null = null;

    try {
        // Get Redis URL from environment
        const redisUrl = process.env.KV_REDIS_URL;

        if (!redisUrl) {
            console.error('Missing KV_REDIS_URL environment variable');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log('Connecting to Redis for retrieval...');

        // Simple connection without TLS (redis:// URL)
        redis = new Redis(redisUrl);

        const dataStr = await redis.get(`sync:${code}`);

        if (!dataStr) {
            return NextResponse.json({ error: 'Invalid code or expired' }, { status: 404 });
        }

        console.log('Data retrieved successfully');

        // Parse JSON
        const data = JSON.parse(dataStr);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Sync retrieve error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        // Clean up connection
        if (redis) {
            try {
                await redis.quit();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}
