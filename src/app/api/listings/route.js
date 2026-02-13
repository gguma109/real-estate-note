import { NextResponse } from 'next/server';
import { getListings, createListing } from '@/lib/storage';

export async function GET() {
    const listings = getListings();
    return NextResponse.json(listings);
}

export async function POST(request) {
    const data = await request.json();
    const newListing = createListing(data);
    return NextResponse.json(newListing);
}
