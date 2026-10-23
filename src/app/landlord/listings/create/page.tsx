import ListingEditor from '@/components/rooms/ListingEditor';
export default async function CreateListingPage({ searchParams }: { searchParams: Promise<{ roomId?: string }> }) {
  const { roomId } = await searchParams;
  return <ListingEditor roomId={roomId} />;
}
