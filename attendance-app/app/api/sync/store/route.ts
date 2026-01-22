import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { data } = await request.json();
        if (!data) {
            return NextResponse.json({ error: 'Data is required' }, { status: 400 });
        }

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in KV with 1 hour expiration (3600 seconds)
        await kv.set(`sync:${code}`, JSON.stringify(data), { ex: 3600 });

        return NextResponse.json({ code, expiresIn: 3600 });
    } catch (error) {
        console.error('Sync store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
