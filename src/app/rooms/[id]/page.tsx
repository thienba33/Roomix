import RoomDetailContent from './RoomDetailContent';
export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomDetailContent id={id} />;
}
