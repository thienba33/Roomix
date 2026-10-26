'use client';

import Link from 'next/link';
import UnavailableFeature from '@/components/account/UnavailableFeature';
import { useApiData } from '@/hooks/useApiData';
import { listProperties, PROPERTIES_EVENT, type House } from '@/services/backend/properties';
import type { PropertyFloor } from '@/services/backend/rooms';
import { useAuth } from '@/components/auth/AuthProvider';
import ListingForm from './ListingForm';

const EMPTY: House[] = [];

export default function ListingEditor({ roomId }: { roomId?: string }) {
  const { user } = useAuth();
  const { data: houses, ready, error, retry } = useApiData('listing-properties', listProperties, EMPTY, PROPERTIES_EVENT);
  if (roomId) return <UnavailableFeature title="Chỉnh sửa phòng và tin" description="Backend chưa cung cấp API đọc phòng và tin nháp của chủ trọ để tải dữ liệu chỉnh sửa." href="/landlord/rooms" linkLabel="Về nhà và tầng" />;
  if (!ready) return <p role="status" className="py-10 text-muted">Đang tải nhà và tầng…</p>;
  if (error) return <div role="alert" className="space-y-3"><p>{error}</p><button type="button" onClick={retry} className="font-semibold text-primary underline">Thử lại</button></div>;
  const floors: PropertyFloor[] = houses.flatMap((house) => house.floors.map((floor) => ({
    houseId: house.id, floorId: floor.id, houseName: house.name, floorName: floor.name,
    floorNumber: floor.floorNumber, landlordId: user?.id ?? '', addressStreet: house.addressStreet,
    ward: house.ward, district: house.district, city: house.city,
  })));
  if (!floors.length) return <div className="space-y-4 rounded-2xl border border-line p-8"><h1 className="text-xl font-bold">Chưa có tầng để tạo phòng</h1><p className="text-sm text-muted">Thêm nhà và tầng trước khi tạo phòng và tin nháp.</p><Link href="/landlord/rooms" className="font-semibold text-primary">Quản lý nhà và tầng</Link></div>;
  return <ListingForm floors={floors} />;
}
