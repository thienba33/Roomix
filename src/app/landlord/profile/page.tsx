'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { landlord as seed, stats } from '@/lib/data';
import { LS_KEYS } from '@/lib/landlord-store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const checkIcon = (<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg></span>);
const VERIFICATIONS = ['Đã xác minh CCCD', 'Đã xác minh số điện thoại', 'Địa chỉ nhà khớp giấy tờ'];
const inputCls = 'w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function HoSoPage() {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: seed.name, phone: seed.phone, email: seed.email });
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { try { const raw = localStorage.getItem(LS_KEYS.profile); if (raw) { const p = JSON.parse(raw); setProfile(p); setDraft(p); } } catch { /* ignore */ } }, []);
  const joinedYear = seed.joinedAt.split('/')[1] ?? seed.joinedAt;
  const display = editing ? draft : profile;
  const fields = [
    { label: 'SỐ ĐIỆN THOẠI', value: profile.phone }, { label: 'EMAIL', value: profile.email },
    { label: 'ĐANG QUẢN LÝ', value: `3 nhà · ${stats.totalRooms} phòng` }, { label: 'KHU VỰC', value: 'Thanh Xuân, Hà Nội' },
  ];

  const save = () => {
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = 'Họ tên là bắt buộc';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) e.email = 'Email không hợp lệ';
    if (!/^[0-9\s+]{9,13}$/.test(draft.phone.trim())) e.phone = 'Số điện thoại không hợp lệ (9–13 ký tự số)';
    setErrors(e); if (Object.keys(e).length) return;
    const prev = profile; setProfile(draft); try { localStorage.setItem(LS_KEYS.profile, JSON.stringify(draft)); } catch { /* ignore */ }
    setEditing(false);
    toast.push('Đã lưu hồ sơ (mock)', 'Backend chưa có endpoint cập nhật hồ sơ — xem đánh giá', { label: 'Hoàn tác', onClick: () => { setProfile(prev); try { localStorage.setItem(LS_KEYS.profile, JSON.stringify(prev)); } catch { /* ignore */ } } });
  };

  return (
    <div>
      <div><h1 className="text-2xl font-semibold text-ink">Hồ sơ nhà trọ</h1></div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-extrabold text-primary">{seed.initials}</span><div><h2 className="text-[17px] font-semibold text-ink">{profile.name}</h2><p className="mt-0.5 text-[13px] text-muted">Chủ trọ · tham gia từ {joinedYear}</p></div></div>
            {!editing ? (
              <><div className="mt-6 space-y-4">{fields.map((f) => (<div key={f.label}><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{f.label}</p><p className="mt-0.5 font-medium text-ink">{f.value}</p></div>))}</div>
              <Button type="button" variant="outline" className="mt-6 w-[142px]" onClick={() => { setDraft(profile); setErrors({}); setEditing(true); }}>Chỉnh sửa</Button></>
            ) : (
              <div className="mt-6 space-y-4">
                <div><label className="mb-1.5 block text-[13px] font-semibold text-ink">Họ tên <span className="text-red-600">*</span></label><input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={inputCls} autoComplete="name" />{errors.name && <p className="mt-1 text-[13px] text-red-600" role="alert">{errors.name}</p>}</div>
                <div><label className="mb-1.5 block text-[13px] font-semibold text-ink">Số điện thoại <span className="text-red-600">*</span></label><input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} className={inputCls} autoComplete="tel" />{errors.phone && <p className="mt-1 text-[13px] text-red-600" role="alert">{errors.phone}</p>}</div>
                <div><label className="mb-1.5 block text-[13px] font-semibold text-ink">Email <span className="text-red-600">*</span></label><input value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} className={inputCls} autoComplete="email" />{errors.email && <p className="mt-1 text-[13px] text-red-600" role="alert">{errors.email}</p>}</div>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">Backend hiện chỉ có GET /users/me, chưa có PUT/PATCH cập nhật hồ sơ — lưu ở đây là mock cục bộ (UI-ahead theo UC01.4).</p>
                <div className="flex gap-2"><Button onClick={save}>Lưu</Button><Button variant="outline" onClick={() => setEditing(false)}>Hủy</Button></div>
              </div>
            )}
          </Card>
          <Card className="p-5"><h3 className="font-semibold text-ink">Xác minh chủ trọ</h3><div className="mt-4 space-y-3.5">{VERIFICATIONS.map((v) => (<div key={v} className="flex items-center gap-2.5 text-sm text-ink">{checkIcon}<span>{v}</span></div>))}</div></Card>
        </div>
        <Card className="p-6">
          <h3 className="font-semibold text-ink">Danh thiếp gửi cho khách</h3><p className="mt-1 text-[13px] text-muted">Contact Card — khách chỉ thấy sau khi bạn chấp nhận</p>
          <div className="mt-5 max-w-[480px] rounded-2xl border border-line p-6"><Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-[52px] w-auto" /><p className="mt-4 font-semibold text-ink">{display.name} — Chủ trọ Roomix</p><p className="mt-2 text-sm text-ink">SĐT / Zalo · {display.phone}</p><p className="mt-1 text-[13px] text-muted">{display.email}</p><p className="mt-1.5 text-[13px] text-muted">Thường phản hồi trong ~1 giờ</p></div>
          <p className="mt-4 text-[13px] text-muted">Xem trước đúng như khách nhận được — cập nhật theo hồ sơ vừa lưu.</p>
        </Card>
      </div>
    </div>
  );
}
