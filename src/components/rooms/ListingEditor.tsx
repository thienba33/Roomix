'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { listProperties, PROPERTIES_EVENT, type House } from '@/services/backend/properties';
import { AUTH_EVENT, getLandlordRoom, type CatalogRoom, type PropertyFloor } from '@/services/backend/rooms';
import { useAuth } from '@/components/auth/AuthProvider';
import ListingForm from './ListingForm';

const EMPTY: House[] = [];

export default function ListingEditor({ roomId }: { roomId?: string }) {
  const { user } = useAuth();
  const { data: houses, ready, error, retry } = useApiData('listing-properties', listProperties, EMPTY, PROPERTIES_EVENT);
  const loadRoom = useCallback(() => roomId ? getLandlordRoom(roomId) : Promise.resolve(null), [roomId]);
  // Keep the form mounted when saving emits CATALOG_EVENT; navigation reloads the editor.
  const room = useApiData<CatalogRoom | null>(`listing-edit:${roomId ?? 'new'}`, loadRoom, null, AUTH_EVENT);
  if (!ready || !room.ready) return <p role="status" className="py-10 text-muted">Đang tải nhà, tầng và thông tin phòng…</p>;
  if (error || room.error) return <div role="alert" className="space-y-3"><p>{error || room.error}</p><button type="button" onClick={() => { retry(); room.retry(); }} className="font-semibold text-primary underline">Thử lại</button><Link href="/landlord/listings" className="block text-primary">Về danh sách tin</Link></div>;
  if (roomId && (!room.data || !['DRAFT', 'REJECTED'].includes(room.data.postStatus))) return <div role="alert" className="space-y-3"><p>Chỉ sửa được tin nháp hoặc tin bị từ chối. Tin này hiện không thể chỉnh sửa.</p><Link href="/landlord/listings" className="font-semibold text-primary">Về danh sách tin</Link></div>;

  const floors: PropertyFloor[] = houses.flatMap((house) => house.floors.map((floor) => ({
    houseId: house.id, floorId: floor.id, houseName: house.name, floorName: floor.name,
    floorNumber: floor.floorNumber, landlordId: user?.id ?? '', addressStreet: house.addressStreet,
    ward: house.ward, district: house.district, city: house.city,
  })));

  if (!floors.length) {
    return (
      <div className="space-y-4 rounded-2xl border border-line p-8">
        <h1 className="text-xl font-bold">Chưa có tầng để tạo phòng</h1>
        <p className="text-sm text-muted">Thêm nhà và tầng trước khi tạo phòng và tin nháp.</p>
        <Link href="/landlord/rooms" className="font-semibold text-primary">Quản lý nhà và tầng</Link>
      </div>
    );
  }

  return <ListingForm key={roomId ?? 'new'} current={room.data ?? undefined} floors={floors} />;
}
