'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useApiData } from '@/hooks/useApiData';
import { profileInitials } from '@/lib/tenant-store';
import {
  getLandlordContact,
  PROFILE_EVENT,
  type LandlordContact,
} from '@/services/backend/auth';
import type { RentalRequest } from '@/services/backend/rental';

export default function ContactCard({ request }: { request: RentalRequest }) {
  if (request.status !== 'ACCEPTED') return null;
  return <AcceptedContactCard request={request} />;
}

function AcceptedContactCard({ request }: { request: RentalRequest }) {
  const loadContact = useCallback(
    () => getLandlordContact(request.landlordId),
    [request.landlordId],
  );
  const {
    data: contact,
    ready,
    error,
    retry,
  } = useApiData<LandlordContact | null>(
    `rental-contact:${request.landlordId}`,
    loadContact,
    null,
    PROFILE_EVENT,
  );

  return (
    <section className="mt-4 rounded-xl border border-green-200 bg-green-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-green-900">
          <span aria-hidden="true">📇</span> Danh thiếp liên hệ chủ trọ
        </h3>
        <Badge tone="green">Đã cấp quyền liên hệ</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-green-800">
        Yêu cầu thuê đã được chấp nhận. Hãy liên hệ trực tiếp để thống nhất thời gian xem phòng,
        nhận phòng và các điều khoản hợp đồng.
      </p>

      {!ready && <p role="status" className="mt-3 text-sm text-muted">Đang tải thông tin liên hệ…</p>}

      {error && (
        <div className="mt-3 rounded-lg border border-red-100 bg-white p-3 text-sm">
          <p role="alert" className="text-red-700">{error}</p>
          <button type="button" onClick={retry} className="mt-2 font-semibold text-primary hover:underline">
            Thử tải lại
          </button>
        </div>
      )}

      {contact && <ContactDetails contact={contact} approvedAt={request.updatedAt} />}
    </section>
  );
}

function ContactDetails({ contact, approvedAt }: { contact: LandlordContact; approvedAt: string }) {
  const avatarStyle = contact.avatarUrl
    ? { backgroundImage: `url(${JSON.stringify(contact.avatarUrl)})` }
    : undefined;
  const zaloHref = contact.zalo
    ? /^https?:\/\//i.test(contact.zalo)
      ? contact.zalo
      : `https://zalo.me/${contact.zalo.replace(/\D/g, '') || encodeURIComponent(contact.zalo)}`
    : '';

  return (
    <div className="mt-3 rounded-lg border border-green-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={`Ảnh đại diện của ${contact.fullName}`}
          style={avatarStyle}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft bg-cover bg-center text-sm font-bold text-primary"
        >
          {!contact.avatarUrl && profileInitials(contact.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/landlords/${contact.id}`} className="break-words font-bold text-ink hover:text-primary">
            {contact.fullName}
          </Link>
          <p className="mt-0.5 text-xs text-muted">
            Chấp nhận lúc {new Date(approvedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={`tel:${contact.phoneNumber.replace(/[^\d+]/g, '')}`}
          className="rounded-lg bg-page px-3 py-2.5 text-xs transition hover:bg-primary-soft"
        >
          <span className="block text-muted">Điện thoại</span>
          <strong className="mt-0.5 block break-words text-primary">{contact.phoneNumber}</strong>
        </a>
        {zaloHref ? (
          <a
            href={zaloHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-page px-3 py-2.5 text-xs transition hover:bg-primary-soft"
          >
            <span className="block text-muted">Zalo</span>
            <strong className="mt-0.5 block break-words text-primary">{contact.zalo}</strong>
          </a>
        ) : (
          <div className="rounded-lg bg-page px-3 py-2.5 text-xs">
            <span className="block text-muted">Zalo</span>
            <span className="mt-0.5 block text-secondary">Chưa cập nhật</span>
          </div>
        )}
      </div>
    </div>
  );
}
