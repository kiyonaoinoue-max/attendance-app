import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { data } = await request.json();
        if (!data) {
            return NextResponse.json({ error: 'Data is required' }, { status: 400 });
        }

        // Determine correct connection string
        const connectionString = process.env.KV_REDIS_URL || process.env.KV_URL || process.env.REDIS_URL;

        if (!connectionString) {
            throw new Error('Missing Redis connection string (KV_REDIS_URL)');
        }

        const redis = new Redis(connectionString);

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Redis with 1 hour expiration (3600 seconds)
        await redis.set(`sync:${code}`, JSON.stringify(data), 'EX', 3600);

        // Close connection to prevent leaks in serverless
        await redis.quit();

        return NextResponse.json({ code, expiresIn: 3600 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
