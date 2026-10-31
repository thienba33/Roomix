import LandlordListingDetail from '@/components/rooms/LandlordListingDetail';

export default async function LandlordListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LandlordListingDetail roomId={id} />;
}
