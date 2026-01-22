import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { data } = await request.json();
        if (!data) {
            return NextResponse.json({ error: 'Data is required' }, { status: 400 });
        }

        // Get connection info from environment
        const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            console.error('Missing Redis REST API credentials');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const redis = new Redis({ url, token });

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store with 1 hour expiration (3600 seconds)
        await redis.set(`sync:${code}`, JSON.stringify(data), { ex: 3600 });

        return NextResponse.json({ code, expiresIn: 3600 });
    } catch (error) {
        console.error('Sync store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
