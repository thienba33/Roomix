'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import { useCatalog } from '@/hooks/useCatalog';
import { readProperties } from '@/services/mock/rooms';
import ListingForm from './ListingForm';

export default function ListingEditor({ roomId }: { roomId?: string }) {
  const { user, ready: authReady } = useAuth();
  const { items, ready, error, retry } = useCatalog();
  if (!ready || !authReady) return <p role="status" className="py-10 text-muted">Đang tải thông tin phòng…</p>;
  if (user?.role !== 'LANDLORD') return <p role="alert">Bạn cần đăng nhập bằng tài khoản chủ trọ để soạn tin.</p>;
  if (error) return <div role="alert" className="space-y-4 rounded-2xl border border-line p-6"><h1 className="text-xl font-bold">Chưa thể tải thông tin phòng</h1><p>{error}</p><Button variant="outline" onClick={retry}>Thử lại</Button></div>;

  const current = items.find((room) => room.detail.roomId === roomId && room.landlordId === user.id);
  const floors = readProperties().filter((floor) => floor.landlordId === user.id);
  const unavailable = roomId && (!current || !['DRAFT', 'REJECTED'].includes(current.postStatus));
  if (unavailable || !floors.length) return (
    <div className="space-y-4 rounded-2xl border border-line p-8">
      <h1 className="text-xl font-bold">{unavailable ? 'Tin này không thể chỉnh sửa' : 'Chưa có nhà và tầng để tạo phòng'}</h1>
      <p className="max-w-lg text-sm leading-6 text-muted">{unavailable ? 'Chỉ có thể sửa tin nháp hoặc tin bị từ chối thuộc tài khoản của bạn.' : 'Liên hệ quản trị viên để kiểm tra thông tin nhà và tầng của tài khoản.'}</p>
      <Link href="/landlord/listings" className="inline-block text-sm font-semibold text-primary">Về tin đăng của tôi</Link>
    </div>
  );
  return <ListingForm key={`${user.id}:${roomId ?? 'new'}`} current={current} floors={floors} />;
}
