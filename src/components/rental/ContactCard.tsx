'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { getAcceptedContact, requestLandlordContact, type RentalRequest } from '@/services/mock/rental';

type Contact = NonNullable<ReturnType<typeof getAcceptedContact>>;

export default function ContactCard({ request }: { request: RentalRequest }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(!!request.contactRequestedAt);
  if (request.status !== 'ACCEPTED') return null;

  const reveal = () => {
    try { setContact(getAcceptedContact(request.id)); setOpened(true); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể mở danh thiếp.'); }
  };
  const requestContact = () => {
    try { requestLandlordContact(request.id); setRequested(true); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể gửi yêu cầu bổ sung liên hệ.'); }
  };

  return <section aria-label="Danh thiếp chủ trọ" className="mt-4 rounded-xl border border-primary/20 bg-primary-soft/30 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-ink">Liên hệ chủ trọ</h3><p className="mt-1 text-xs leading-5 text-muted">Chỉ bạn, người có yêu cầu đã được chấp nhận, mới xem được thông tin này.</p></div>{!opened && <Button size="sm" variant="outline" onClick={reveal}>Xem liên hệ</Button>}</div>
    {opened && contact && <dl className="mt-4 grid gap-3 border-t border-primary/10 pt-4 text-sm sm:grid-cols-2"><div><dt className="text-muted">Chủ trọ</dt><dd className="mt-1 font-semibold">{contact.fullName}</dd></div><div><dt className="text-muted">Số điện thoại</dt><dd className="mt-1 font-semibold"><a href={`tel:${contact.phoneNumber.replace(/\s/g, '')}`} className="text-primary hover:underline">{contact.phoneNumber}</a></dd></div>{contact.email && <div className="sm:col-span-2"><dt className="text-muted">Email</dt><dd className="mt-1 break-all font-semibold"><a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></dd></div>}</dl>}
    {opened && !contact && <div className="mt-4 border-t border-primary/10 pt-4"><p className="text-sm text-secondary">Chủ trọ chưa cung cấp số điện thoại để mở danh thiếp.</p>{requested ? <p role="status" className="mt-2 text-sm font-semibold text-primary">Đã ghi nhận yêu cầu bổ sung liên hệ.</p> : <Button size="sm" className="mt-3" onClick={requestContact}>Yêu cầu bổ sung liên hệ</Button>}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
