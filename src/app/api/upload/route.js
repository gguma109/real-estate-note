import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
    return NextResponse.json({ error: 'Image upload is not supported in this demo environment on Cloudflare Pages.' }, { status: 501 });
}
