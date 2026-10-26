import { formatVND } from '@/lib/utils';
import { getSubmissionRequirements } from '@/lib/listing-validation';
import type { ListingInput, propertyFixtures } from '@/services/mock/rooms';
import { ListingPhoto, SubmissionChecklist } from './ListingVisuals';

export default function ListingPreview({ value, images, floor }: {
  value: ListingInput;
  images: string[];
  floor?: (typeof propertyFixtures)[number];
}) {
  const hasPrice = Number.isFinite(value.basePrice) && value.basePrice >= 0;
  return (
    <aside aria-label="Xem trước tin đăng" className="space-y-6 lg:sticky lg:top-8 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-sm font-bold">Xem trước tin</h2><span className="text-xs text-muted">Chưa công khai</span></div>
        <div className="p-4">
          <ListingPhoto src={images[0]} alt="Ảnh đại diện của tin đang soạn" className="aspect-[4/3] rounded-xl" />
          <div className="px-1 pb-2 pt-4">
            <h3 className="break-words text-lg font-bold leading-7 tracking-tight">{value.title.trim() || 'Tiêu đề tin đăng của bạn'}</h3>
            <p className="mt-3 text-xl font-extrabold">{hasPrice ? formatVND(value.basePrice) : 'Chưa nhập giá'}<span className="text-xs font-normal text-muted"> / tháng</span></p>
            <p className="mt-3 text-sm text-muted">{Number.isFinite(value.area) && value.area > 0 ? `${value.area} m²` : 'Chưa có diện tích'} · {Number.isInteger(value.maxTenants) && value.maxTenants > 0 ? `${value.maxTenants} người` : 'Chưa có sức chứa'}</p>
            <p className="mt-2 break-words text-xs leading-5 text-muted">{floor?.houseName ?? 'Chọn nhà'} / {floor?.floorName ?? 'Chọn tầng'}{value.roomNumber.trim() ? ` / Phòng ${value.roomNumber.trim()}` : ''}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-page p-5">
        <h2 className="mb-4 text-sm font-bold">Trước khi gửi duyệt</h2>
        <SubmissionChecklist requirements={getSubmissionRequirements(value.area, value.basePrice, images.length)} />
        <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-muted">Lưu nháp trước. Khi đã hoàn thiện, gửi duyệt từ danh sách tin đăng.</p>
      </div>
    </aside>
  );
}
