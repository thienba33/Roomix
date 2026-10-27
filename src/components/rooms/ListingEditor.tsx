'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { listProperties, PROPERTIES_EVENT, type House } from '@/services/backend/properties';
import { getRoomDetail, type CatalogRoom, type PropertyFloor } from '@/services/backend/rooms';
import { useAuth } from '@/components/auth/AuthProvider';
import ListingForm from './ListingForm';

const EMPTY: House[] = [];

export default function ListingEditor({ roomId }: { roomId?: string }) {
  const { user } = useAuth();
  const { data: houses, ready, error, retry } = useApiData('listing-properties', listProperties, EMPTY, PROPERTIES_EVENT);
  const [currentRoom, setCurrentRoom] = useState<CatalogRoom | undefined>(undefined);
  const [loadingRoom, setLoadingRoom] = useState(!!roomId);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    getRoomDetail(roomId)
      .then((det) => {
        if (!cancelled && det) {
          setCurrentRoom({
            legacyId: 0,
            postStatus: 'DRAFT',
            roomStatus: det.rented ? 'OCCUPIED' : 'AVAILABLE',
            detail: det,
            landlordId: user?.id ?? '',
          });
        }
      })
      .catch(() => {
        // When post is in draft, room details might not be publicly visible via /api/rooms
      })
      .finally(() => {
        if (!cancelled) setLoadingRoom(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, user?.id]);

  if (!ready || loadingRoom) return <p role="status" className="py-10 text-muted">Đang tải nhà, tầng và thông tin phòng…</p>;
  if (error) return <div role="alert" className="space-y-3"><p>{error}</p><button type="button" onClick={retry} className="font-semibold text-primary underline">Thử lại</button></div>;

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

  return <ListingForm current={currentRoom} floors={floors} />;
}
