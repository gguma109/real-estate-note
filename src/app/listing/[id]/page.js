import Editor from '@/components/Editor';

export default async function ListingPage({ params }) {
    const { id } = await params;
    return <Editor listingId={id} />;
}
