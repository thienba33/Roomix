'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { profileInitials } from '@/lib/tenant-store';
import { PROFILE_EVENT } from '@/services/backend/auth';
import { getRentalContactCard, type RentalContactCard, type RentalRequest } from '@/services/backend/rental';

export default function ContactCard({ request }: { request: RentalRequest }) {
  if (request.status !== 'ACCEPTED') return null;
  return <AcceptedContactCard request={request} />;
}

function AcceptedContactCard({ request }: { request: RentalRequest }) {
  const loadContact = useCallback(
    () => getRentalContactCard(request.id),
    [request.id],
  );
  const {
    data: contact,
    ready,
    error,
    retry,
  } = useApiData<RentalContactCard | null>(
    `rental-contact:${request.id}`,
    loadContact,
    null,
    PROFILE_EVENT,
  );

  return (
    <section className="tenant-contact" aria-label="Liên hệ chủ trọ">
      <h3 className="tenant-contact-title">Liên hệ chủ trọ</h3>

      {!ready && <p role="status" className="mt-3 text-sm text-muted">Đang tải thông tin liên hệ…</p>}

      {error && (
        <div className="mt-3 text-sm">
          <p role="alert" className="text-red-700">{error}</p>
          <button type="button" onClick={retry} className="mt-2 font-semibold text-primary hover:underline">
            Thử tải lại
          </button>
        </div>
      )}

      {contact && <ContactDetails contact={contact} />}
    </section>
  );
}

function ContactDetails({ contact }: { contact: RentalContactCard }) {
  const avatarStyle = contact.landlordAvatarUrl
    ? { backgroundImage: `url(${JSON.stringify(contact.landlordAvatarUrl)})` }
    : undefined;
  const zaloHref = contact.landlordZalo
    ? /^https:\/\/(www\.)?zalo\.me\//i.test(contact.landlordZalo)
      ? contact.landlordZalo
      : `https://zalo.me/${encodeURIComponent(contact.landlordZalo)}`
    : '';

  return (
    <div className="tenant-contact-details">
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={`Ảnh đại diện của ${contact.landlordName}`}
          style={avatarStyle}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-primary-soft bg-cover bg-center text-sm font-bold text-primary"
        >
          {!contact.landlordAvatarUrl && profileInitials(contact.landlordName)}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/landlords/${contact.landlordId}`} className="break-words font-bold text-ink hover:text-primary">
            {contact.landlordName}
          </Link>
          <p className="mt-0.5 text-xs text-muted">
            Phát hành lúc {new Date(contact.issuedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      <div className="tenant-contact-actions">
        <a
          href={`tel:${contact.landlordPhone.replace(/[^\d+]/g, '')}`}
          className="tenant-contact-channel"
        >
          <span className="block text-muted">Điện thoại</span>
          <strong className="mt-1 block break-words text-base text-ink">{contact.landlordPhone}</strong><span className="mt-2 block font-semibold text-primary">Gọi điện</span>
        </a>
        {zaloHref ? (
          <a
            href={zaloHref}
            target="_blank"
            rel="noreferrer"
            className="tenant-contact-channel"
          >
            <span className="block text-muted">Zalo</span>
            <strong className="mt-1 block break-words text-sm text-ink">{contact.landlordZalo}</strong><span className="mt-2 block font-semibold text-primary">Mở Zalo</span>
          </a>
        ) : (
          <div className="tenant-contact-channel tenant-contact-channel-empty">
            <span className="block text-muted">Zalo</span>
            <span className="mt-0.5 block text-secondary">Chưa cập nhật</span>
          </div>
        )}
      </div>
    </div>
  );
}
