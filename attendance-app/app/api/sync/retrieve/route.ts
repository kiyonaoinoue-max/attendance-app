import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        const dataStr = await kv.get<string>(`sync:${code}`);

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
