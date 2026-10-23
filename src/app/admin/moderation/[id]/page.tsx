import ListingManager from '@/components/rooms/ListingManager';
export default async function ModerationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingManager admin postId={id} />;
}
