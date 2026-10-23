import { redirect } from 'next/navigation';
import { roomUuid } from '@/services/mock/rooms';
import RoomDetailContent from './RoomDetailContent';
export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (/^\d+$/.test(id)) redirect(`/rooms/${roomUuid(Number(id))}`);
  return <RoomDetailContent id={id} />;
}
