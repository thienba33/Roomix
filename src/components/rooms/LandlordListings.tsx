'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { listLandlordOverview, PROPERTIES_EVENT, type LandlordPropertyOverview } from '@/services/backend/properties';
import { changePostStatus, CATALOG_EVENT } from '@/services/backend/rooms';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';

const EMPTY: LandlordPropertyOverview[] = [];

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Trống (AVAILABLE)',
  OCCUPIED: 'Đang thuê (OCCUPIED)',
  RESERVED: 'Đã giữ chỗ (RESERVED)',
  MAINTENANCE: 'Bảo trì (MAINTENANCE)',
};

export default function LandlordListings() {
  const { data: properties, ready, error, retry } = useApiData(
    'landlord-overview',
    listLandlordOverview,
    EMPTY,
    `${PROPERTIES_EVENT},${CATALOG_EVENT}`
  );
  const [filter, setFilter] = useState('ALL');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const allRooms = properties.flatMap((prop) =>
    prop.rooms.map((room) => ({
      ...room,
      houseId: prop.houseId,
      houseName: prop.houseName,
      address: prop.address,
    }))
  );

  const totalRooms = allRooms.length;
  const availableRooms = allRooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'OCCUPIED').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const filteredRooms = allRooms.filter((r) => filter === 'ALL' || r.status === filter);

  const handlePostAction = async (roomId: string, action: 'submit' | 'hide' | 'unhide') => {
    setActionBusy(roomId);
    setNotice('');
    setActionError('');
    try {
      await changePostStatus(roomId, action);
      setNotice(
        action === 'submit'
          ? 'Đã gửi phòng & bài đăng vào hàng chờ kiểm duyệt của Admin (PENDING).'
          : action === 'hide'
          ? 'Đã ẩn bài đăng khỏi trang tìm kiếm công khai.'
          : 'Đã hiện lại bài đăng trên trang tìm kiếm công khai.'
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể thực hiện thao tác.');
    } finally {
      setActionBusy(null);
    }
  };

  if (!ready) {
    return <p role="status" className="py-10 text-muted">Đang tải danh sách phòng và bài đăng…</p>;
  }

  if (error) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">{error}</p>
        <button type="button" onClick={retry} className="text-sm font-semibold text-primary underline">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="host-listings space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Phòng và tin đăng</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/landlord/listings/create"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            Đăng phòng
          </Link>
          <Link
            href="/landlord/rooms"
            className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-secondary hover:border-primary"
          >
            Quản lý nhà &amp; tầng
          </Link>
        </div>
      </header>

      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

      {/* KPI phòng trống và tỷ lệ lấp đầy */}
      <div className="host-metrics grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold text-muted">Tổng số phòng</span>
          <p className="mt-1 text-2xl font-extrabold text-ink">{totalRooms}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold text-muted">Phòng đang trống</span>
          <p className="mt-1 text-2xl font-extrabold text-green-600">{availableRooms}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold text-muted">Phòng đang cho thuê</span>
          <p className="mt-1 text-2xl font-extrabold text-primary">{occupiedRooms}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold text-muted">Tỷ lệ lấp đầy</span>
          <p className="mt-1 text-2xl font-extrabold text-secondary">{occupancyRate}%</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {filteredRooms.length} phòng {filter !== 'ALL' ? `ở trạng thái ${statusLabels[filter]}` : ''}
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Trạng thái phòng:
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-normal focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Phòng trống (AVAILABLE)</option>
            <option value="OCCUPIED">Đang thuê (OCCUPIED)</option>
            <option value="RESERVED">Đã giữ chỗ (RESERVED)</option>
            <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
          </select>
        </label>
      </div>

      {/* Room Listing Grid */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold">
            {totalRooms === 0 ? 'Bạn chưa có phòng trọ nào' : 'Không có phòng phù hợp với bộ lọc'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {totalRooms === 0
              ? 'Tạo nhà, thêm tầng rồi đăng phòng đầu tiên để bắt đầu đón khách thuê.'
              : 'Chọn trạng thái khác hoặc xóa bộ lọc để xem toàn bộ danh sách.'}
          </p>
          {totalRooms === 0 && (
            <Link
              href="/landlord/listings/create"
              className="mt-5 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              + Tạo phòng mới
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredRooms.map((room) => {
            const tone =
              room.status === 'AVAILABLE'
                ? 'green'
                : room.status === 'OCCUPIED'
                ? 'indigo'
                : room.status === 'RESERVED'
                ? 'amber'
                : 'gray';

            return (
              <article
                key={room.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 transition hover:border-primary/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">{room.houseName}</span>
                    <Badge tone={tone} dot>{statusLabels[room.status] ?? room.status}</Badge>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-ink">Phòng {room.roomNumber}</h3>
                  <p className="mt-1 text-xs text-muted line-clamp-1">{room.address}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-page p-3 text-xs">
                    <div>
                      <span className="text-muted">Diện tích:</span>
                      <p className="font-semibold">{room.area} m²</p>
                    </div>
                    <div>
                      <span className="text-muted">Giá thuê cơ bản:</span>
                      <p className="font-bold text-primary">{formatVND(room.basePrice)}/tháng</p>
                    </div>
                    <div>
                      <span className="text-muted">Tối đa:</span>
                      <p className="font-semibold">{room.maxTenants} người</p>
                    </div>
                    <div>
                      <span className="text-muted">Mã phòng:</span>
                      <p className="font-mono">{room.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>

                {/* Thao tác gửi duyệt, ẩn và hiện tin */}
                <div className="mt-5 border-t border-line pt-3 flex flex-wrap gap-2 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionBusy === room.id}
                    onClick={() => void handlePostAction(room.id, 'submit')}
                  >
                    Gửi duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionBusy === room.id}
                    onClick={() => void handlePostAction(room.id, 'hide')}
                  >
                    Ẩn tin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionBusy === room.id}
                    onClick={() => void handlePostAction(room.id, 'unhide')}
                  >
                    Hiện tin
                  </Button>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold text-primary hover:underline ml-auto"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
