import LandlordListings from '@/components/rooms/LandlordListings';

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ house?: string | string[] }> }) {
  const params = await searchParams;
  return <LandlordListings initialHouse={typeof params.house === 'string' ? params.house : ''} />;
}
