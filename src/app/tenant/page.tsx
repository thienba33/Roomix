'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { visibleRental, type RentalRequest, type Tenancy, RENTAL_EVENT } from '@/services/backend/rental';
import { visibleInvoices, type InvoiceSummary, INVOICE_EVENT } from '@/services/backend/invoices';
import { useFavorites } from '@/hooks/useFavorites';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const { items: favorites } = useFavorites();
  const [rentalData, setRentalData] = useState<{ requests: RentalRequest[]; tenancies: Tenancy[] }>({
    requests: [],
    tenancies: [],
  });
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      try {
        const [rentalRes, invoiceRes] = await Promise.all([
          visibleRental(),
          visibleInvoices(),
        ]);
        if (active) {
          setRentalData(rentalRes);
          setInvoices(invoiceRes);
        }
      } catch (err) {
        console.error('Failed to load tenant dashboard data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardData();

    window.addEventListener(RENTAL_EVENT, fetchDashboardData);
    window.addEventListener(INVOICE_EVENT, fetchDashboardData);
    return () => {
      active = false;
      window.removeEventListener(RENTAL_EVENT, fetchDashboardData);
      window.removeEventListener(INVOICE_EVENT, fetchDashboardData);
    };
  }, []);

  const activeTenancies = rentalData.tenancies.filter((t) => t.status === 'ACTIVE');
  const pendingRequests = rentalData.requests.filter((r) => r.status === 'PENDING');
  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING' || i.overdue);
  const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header Lời chào */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            Xin chào, {user?.fullName || 'Khách thuê'} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Chào mừng bạn đến với trang quản lý phòng thuê Roomix.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tenant/search"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Tìm phòng mới
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Đang tải dữ liệu tổng quan…</div>
      ) : (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Thẻ: Hợp đồng hiện tại */}
            <Link
              href="/tenant/contracts"
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Phòng đang thuê</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-ink">{activeTenancies.length}</p>
                <p className="mt-1 text-xs text-muted group-hover:text-primary">
                  {activeTenancies.length > 0 ? 'Xem hợp đồng & chi tiết →' : 'Chưa có phòng đang thuê'}
                </p>
              </div>
            </Link>

            {/* Thẻ: Hóa đơn cần thanh toán */}
            <Link
              href="/tenant/invoices"
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Hóa đơn cần đóng</span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${pendingInvoices.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-ink">{pendingInvoices.length}</p>
                <p className="mt-1 text-xs text-muted group-hover:text-primary">
                  {pendingInvoices.length > 0
                    ? `Cần thanh toán: ${totalPendingAmount.toLocaleString('vi-VN')} đ →`
                    : 'Không có hóa đơn nợ →'}
                </p>
              </div>
            </Link>

            {/* Thẻ: Yêu cầu thuê */}
            <Link
              href="/tenant/requests"
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Yêu cầu chờ duyệt</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-ink">{pendingRequests.length}</p>
                <p className="mt-1 text-xs text-muted group-hover:text-primary">
                  {pendingRequests.length > 0 ? 'Đang chờ chủ trọ phản hồi →' : 'Xem danh sách yêu cầu →'}
                </p>
              </div>
            </Link>

            {/* Thẻ: Phòng yêu thích */}
            <Link
              href="/tenant/favorites"
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Phòng đã lưu</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-ink">{favorites.length}</p>
                <p className="mt-1 text-xs text-muted group-hover:text-primary">Xem các phòng đã lưu →</p>
              </div>
            </Link>
          </div>

          {/* Hóa đơn cần chú ý */}
          {pendingInvoices.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-amber-900">Hóa đơn cần thanh toán</h2>
                  <p className="text-sm text-amber-700">Bạn có {pendingInvoices.length} hóa đơn đang chờ thanh toán.</p>
                </div>
                <Link
                  href="/tenant/invoices"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  Thanh toán ngay
                </Link>
              </div>
            </div>
          )}

          {/* Quick Navigation Cards */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-ink">Chức năng quản lý</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/tenant/requests"
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="rounded-xl bg-primary-soft p-3 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Yêu cầu thuê phòng</h3>
                  <p className="mt-1 text-xs text-muted">Theo dõi và quản lý các yêu cầu gửi tới chủ trọ.</p>
                </div>
              </Link>

              <Link
                href="/tenant/contracts"
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="rounded-xl bg-primary-soft p-3 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6v20h12V6l-4-4ZM14 2v5h5M9 12h6M9 16h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Hợp đồng thuê</h3>
                  <p className="mt-1 text-xs text-muted">Xem hợp đồng điện tử, điều khoản cọc và thời hạn thuê.</p>
                </div>
              </Link>

              <Link
                href="/tenant/invoices"
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="rounded-xl bg-primary-soft p-3 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3H4ZM8 8h8M8 12h8M8 16h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Hóa đơn & Thanh toán</h3>
                  <p className="mt-1 text-xs text-muted">Tra cứu tiền phòng, điện nước và thanh toán qua VNPAY.</p>
                </div>
              </Link>

              <Link
                href="/tenant/favorites"
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Phòng yêu thích</h3>
                  <p className="mt-1 text-xs text-muted">Xem lại các phòng trọ bạn đã thả tim khi tìm kiếm.</p>
                </div>
              </Link>

              <Link
                href="/tenant/reports"
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="rounded-xl bg-primary-soft p-3 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 3v18M4 4h15l-3 5 3 5H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Báo cáo & Phản ánh</h3>
                  <p className="mt-1 text-xs text-muted">Gửi báo cáo vi phạm hoặc khiếu nại tới ban quản trị.</p>
                </div>
              </Link>

              <Link
                href="/tenant/profile"
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="rounded-xl bg-primary-soft p-3 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Hồ sơ cá nhân</h3>
                  <p className="mt-1 text-xs text-muted">Cập nhật thông tin tài khoản, mật khẩu và số điện thoại.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
