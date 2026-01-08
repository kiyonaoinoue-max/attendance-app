import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        const connectionString = process.env.KV_REDIS_URL || process.env.KV_URL || process.env.REDIS_URL;
        if (!connectionString) {
            throw new Error('Missing Redis connection string (KV_REDIS_URL)');
        }

        const redis = new Redis(connectionString);
        const dataStr = await redis.get(`sync:${code}`);
        await redis.quit();

        if (!dataStr) {
            return NextResponse.json({ error: 'Invalid code or expired' }, { status: 404 });
        }

        // Parse JSON if stored as string
        const data = JSON.parse(dataStr);

        return NextResponse.json({ data });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
