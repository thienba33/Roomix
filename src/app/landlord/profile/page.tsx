import Image from 'next/image';
import { landlord, stats } from '@/lib/data';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const checkIcon = (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
  </span>
);

const VERIFICATIONS = ['Đã xác minh CCCD', 'Đã xác minh số điện thoại', 'Địa chỉ nhà khớp giấy tờ'];

export default function HoSoPage() {
  const joinedYear = landlord.joinedAt.split('/')[1] ?? landlord.joinedAt;

  const fields = [
    { label: 'SỐ ĐIỆN THOẠI', value: landlord.phone },
    { label: 'EMAIL', value: landlord.email },
    { label: 'ĐANG QUẢN LÝ', value: `3 nhà · ${stats.totalRooms} phòng` },
    { label: 'KHU VỰC', value: 'Thanh Xuân, Hà Nội' },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink">Hồ sơ nhà trọ</h1>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-extrabold text-primary">
                {landlord.initials}
              </span>
              <div>
                <h2 className="text-[17px] font-semibold text-ink">{landlord.name}</h2>
                <p className="mt-0.5 text-[13px] text-muted">Chủ trọ · tham gia từ {joinedYear}</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{f.label}</p>
                  <p className="mt-0.5 font-medium text-ink">{f.value}</p>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-6 w-[142px]">Chỉnh sửa</Button>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-ink">Xác minh chủ trọ</h3>
            <div className="mt-4 space-y-3.5">
              {VERIFICATIONS.map((v) => (
                <div key={v} className="flex items-center gap-2.5 text-sm text-ink">
                  {checkIcon}
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold text-ink">Danh thiếp gửi cho khách</h3>
          <p className="mt-1 text-[13px] text-muted">Contact Card — khách chỉ thấy sau khi bạn chấp nhận</p>
          <div className="mt-5 max-w-[480px] rounded-2xl border border-line p-6">
            <Image src="/images/logo.png" alt="Roomix" width={1500} height={520} className="h-[52px] w-auto" />
            <p className="mt-4 font-semibold text-ink">{landlord.name} — Chủ trọ Roomix</p>
            <p className="mt-2 text-sm text-ink">SĐT / Zalo · {landlord.phone}</p>
            <p className="mt-1.5 text-[13px] text-muted">Thường phản hồi trong ~1 giờ</p>
          </div>
          <p className="mt-4 text-[13px] text-muted">Xem trước đúng như khách nhận được.</p>
        </Card>
      </div>
    </div>
  );
}
