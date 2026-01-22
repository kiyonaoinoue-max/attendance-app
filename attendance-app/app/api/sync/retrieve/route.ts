import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        // Get Redis URL from environment
        const redisUrl = process.env.KV_REDIS_URL;

        if (!redisUrl) {
            console.error('Missing KV_REDIS_URL environment variable');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Connect with TLS enabled (required for Redis Cloud)
        const redis = new Redis(redisUrl, {
            tls: {
                rejectUnauthorized: false
            },
            maxRetriesPerRequest: 3
        });

        const dataStr = await redis.get(`sync:${code}`);

        // Close connection
        await redis.quit();

        if (!dataStr) {
            return NextResponse.json({ error: 'Invalid code or expired' }, { status: 404 });
        }

        // Parse JSON
        const data = JSON.parse(dataStr);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Sync retrieve error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
