import { NextResponse } from 'next/server';
import { getListings, createListing } from '@/lib/storage';

export const runtime = 'edge';

export async function GET() {
    const listings = await getListings();
    return NextResponse.json(listings);
}

export async function POST(request) {
    const data = await request.json();
    const newListing = await createListing(data);
    return NextResponse.json(newListing);
}
