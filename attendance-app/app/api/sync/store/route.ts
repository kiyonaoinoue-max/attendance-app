import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

        // Connect with TLS enabled (required for Redis Cloud)
        const redis = new Redis(redisUrl, {
            tls: {
                rejectUnauthorized: false
            },
            maxRetriesPerRequest: 3
        });

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store with 1 hour expiration (3600 seconds)
        await redis.set(`sync:${code}`, JSON.stringify(data), 'EX', 3600);

        // Close connection
        await redis.quit();

        return NextResponse.json({ code, expiresIn: 3600 });
    } catch (error) {
        console.error('Sync store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
