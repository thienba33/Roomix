'use client';

import { Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TenantShell from '@/components/layouts/TenantShell';
import Button from '@/components/ui/Button';
import { useApiData } from '@/hooks/useApiData';
import {
  getVnpayReturnResult,
  INVOICE_EVENT,
  type VnpayReturnResponse,
} from '@/services/backend/invoices';

export default function VnpayReturnPage() {
  return (
    <TenantShell>
      <Suspense fallback={<PaymentLoading />}>
        <PaymentResult />
      </Suspense>
    </TenantShell>
  );
}

function PaymentResult() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const loadResult = useCallback(() => {
    if (!query) return Promise.reject(new Error('Thiếu dữ liệu phản hồi từ VNPAY.'));
    return getVnpayReturnResult(query);
  }, [query]);
  const {
    data: result,
    ready,
    error,
    retry,
  } = useApiData<VnpayReturnResponse | null>(
    `vnpay-return:${query}`,
    loadResult,
    null,
    INVOICE_EVENT,
  );

  if (!ready) return <PaymentLoading />;
  if (error || !result) {
    return (
      <PaymentCard tone="error" icon="!" title="Không thể kiểm tra giao dịch">
        <p role="alert" className="text-sm leading-6 text-muted">
          {error || 'VNPAY không trả về dữ liệu giao dịch hợp lệ.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={retry}>Thử lại</Button>
          <InvoiceLink />
        </div>
      </PaymentCard>
    );
  }

  const success = result.paymentStatus === 'SUCCESS';
  const failed = result.paymentStatus === 'FAILED';
  const title = success
    ? 'Thanh toán thành công'
    : failed
      ? 'Thanh toán không thành công'
      : result.paymentStatus === 'PENDING'
        ? 'Đang xác nhận thanh toán'
        : 'Không thể xác minh giao dịch';
  const tone = success ? 'success' : failed ? 'error' : 'pending';

  return (
    <PaymentCard tone={tone} icon={success ? '✓' : failed ? '×' : '…'} title={title}>
      <p className="text-sm leading-6 text-muted">{result.message}</p>

      <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-page px-4 text-sm">
        <PaymentField label="Trạng thái" value={paymentStatusLabel(result.paymentStatus)} />
        {result.invoiceId && <PaymentField label="Mã hóa đơn" value={result.invoiceId} mono />}
        {result.txnRef && <PaymentField label="Mã giao dịch" value={result.txnRef} mono />}
        {result.responseCode && <PaymentField label="Mã phản hồi VNPAY" value={result.responseCode} />}
      </dl>

      {result.paymentStatus === 'PENDING' && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Kết quả chưa được ghi nhận. Hãy chờ vài giây rồi chọn “Kiểm tra lại”.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {result.paymentStatus === 'PENDING' && <Button onClick={retry}>Kiểm tra lại</Button>}
        <InvoiceLink />
        <Link href="/" className="inline-flex items-center px-3 text-sm font-semibold text-muted hover:text-ink">
          Về trang chủ
        </Link>
      </div>
    </PaymentCard>
  );
}

function PaymentLoading() {
  return (
    <PaymentCard tone="pending" icon="…" title="Đang kiểm tra thanh toán">
      <p role="status" className="text-sm text-muted">
        Roomix đang xác minh chữ ký và kết quả giao dịch từ VNPAY…
      </p>
    </PaymentCard>
  );
}

function PaymentCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'success' | 'error' | 'pending';
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  const colors = {
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-3xl border border-line bg-white p-6 text-center shadow-sm sm:p-9">
        <span
          aria-hidden="true"
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold ${colors[tone]}`}
        >
          {icon}
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        <div className="mt-3">{children}</div>
      </section>
    </main>
  );
}

function PaymentField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-3 text-left">
      <dt className="text-muted">{label}</dt>
      <dd className={`break-all font-semibold text-ink ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

function InvoiceLink() {
  return (
    <Link
      href="/invoices"
      className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink"
    >
      Xem hóa đơn
    </Link>
  );
}

function paymentStatusLabel(status: VnpayReturnResponse['paymentStatus']) {
  const labels: Record<VnpayReturnResponse['paymentStatus'], string> = {
    SUCCESS: 'Đã thanh toán',
    FAILED: 'Không thành công',
    PENDING: 'Đang xác nhận',
    INVALID: 'Chữ ký không hợp lệ',
    UNKNOWN: 'Không tìm thấy giao dịch',
  };
  return labels[status];
}
