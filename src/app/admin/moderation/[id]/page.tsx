import AdminModeration from '@/components/rooms/AdminModeration';
export default async function ModerationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminModeration postId={id} />;
}
