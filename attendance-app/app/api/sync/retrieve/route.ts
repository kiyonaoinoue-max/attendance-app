import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        // Get connection info from environment
        const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            console.error('Missing Redis REST API credentials');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const redis = new Redis({ url, token });
        const dataStr = await redis.get<string>(`sync:${code}`);

        if (!dataStr) {
            return NextResponse.json({ error: 'Invalid code or expired' }, { status: 404 });
        }

        // Parse JSON if stored as string
        const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Sync retrieve error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
