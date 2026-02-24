import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    let redis: Redis | null = null;

    try {
        const { data } = await request.json();
        if (!data) {
            return NextResponse.json({ error: 'Data is required' }, { status: 400 });
        }

        // Get Redis URL from environment
        const redisUrl = process.env.KV_REDIS_URL;

        if (!redisUrl) {
            console.error('Missing KV_REDIS_URL environment variable');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log('Connecting to Redis...');

        // Simple connection without TLS (redis:// URL)
        redis = new Redis(redisUrl);

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store with 10 minutes expiration (600 seconds)
        await redis.set(`sync:${code}`, JSON.stringify(data), 'EX', 600);

        console.log('Data stored successfully with code:', code);

        return NextResponse.json({ code, expiresIn: 600 });
    } catch (error) {
        console.error('Sync store error:', error);
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
