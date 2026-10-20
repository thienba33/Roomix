import Image from 'next/image';
import { house, landlord, stats } from '@/lib/data';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const checkIcon = (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
  </span>
);

const HOUSE_ROWS = [
  { label: 'Tên nhà', value: house.name },
  { label: 'Địa chỉ', value: house.address },
  { label: 'Tổng phòng', value: `${house.totalRooms} phòng` },
  { label: 'Tỷ lệ lấp đầy', value: `${stats.occupancy}%` },
];

export default function HoSoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Hồ sơ nhà trọ</h1>
        <p className="mt-1 text-sm text-muted">Thông tin chủ trọ và Contact Card của bạn</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-white">
              {landlord.initials}
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-ink">{landlord.name}</h2>
            <p className="mt-1 text-sm text-muted">Chủ trọ · Từ {landlord.joinedAt}</p>
          </div>
          <div className="mt-6 space-y-3 border-t border-line pt-5">
            <div className="flex items-center gap-2.5 text-sm">
              {checkIcon}
              <span className="flex-1 truncate text-ink">{landlord.email}</span>
              <span className="text-[13px] font-semibold text-green-700">Đã xác thực</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              {checkIcon}
              <span className="flex-1 text-ink">{landlord.phone}</span>
              <span className="text-[13px] font-semibold text-green-700">Đã xác thực</span>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h3 className="font-bold text-ink">Thông tin nhà trọ</h3>
            <dl className="mt-4 divide-y divide-line/70">
              {HOUSE_ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">{row.label}</dt>
                  <dd className="text-right text-sm font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="border-primary/20 bg-primary-soft p-6">
            <h3 className="font-bold text-ink">Contact Card của bạn</h3>
            <p className="mt-1 text-[13px] text-muted">Khách thuê nhận được thẻ này khi yêu cầu quan tâm được chấp nhận.</p>
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Image src="/images/logo.png" alt="Roomix" width={36} height={36} className="h-9 w-9 object-contain" />
                <div>
                  <p className="font-extrabold text-ink">{landlord.name}</p>
                  <p className="text-[13px] text-muted">{landlord.house}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-ink">
                <p className="flex items-center gap-2.5">
                  <svg className="text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  {landlord.phone}
                </p>
                <p className="flex items-center gap-2.5">
                  <svg className="text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  {landlord.email}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="sky">Zalo</Badge>
                <Badge tone="indigo">{landlord.phone}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
