import { NextResponse } from 'next/server';
import { getListingById, updateListing, deleteListing } from '@/lib/storage';

export async function GET(request, { params }) {
    const { id } = await params;
    const listing = getListingById(id);
    if (listing) {
        return NextResponse.json(listing);
    }
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
}

export async function PUT(request, { params }) {
    const { id } = await params;
    const data = await request.json();
    const updatedListing = updateListing(id, data);
    if (updatedListing) {
        return NextResponse.json(updatedListing);
    }
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    const success = deleteListing(id);
    if (success) {
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
}
