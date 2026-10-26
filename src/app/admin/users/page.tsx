'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { appendAudit, useAdminUsers, useAuditExtra, type AdminUser } from '@/lib/admin-store';
import { AUTH_EVENT, listMockAccounts, setMockAccountStatusByEmail, type MockUser } from '@/services/mock/auth';
import { cn } from '@/lib/utils';

type RoleFilter = 'all' | 'LANDLORD' | 'TENANT';
type StatusFilter = 'all' | 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusBadge(u: AdminUser) {
  if (u.status === 'LOCKED') return <Badge tone="red" dot>Đã khóa</Badge>;
  if (u.status === 'PENDING_VERIFICATION') return <Badge tone="amber" dot>Chờ xác minh</Badge>;
  return <Badge tone="green" dot>Đang hoạt động</Badge>;
}

// C4 · UC07.1/07.2/07.3 + UC01.5 — lock/unlock and landlord verification
// (approve-landlord / reject-landlord, PENDING_VERIFICATION) all sit behind
// ConfirmDialog naming the consequence, with an undo toast.
export default function UsersPage() {
  const { push } = useToast();
  const [users, setUsers] = useAdminUsers();
  const [, setAuditExtra] = useAuditExtra();
  const [mockAccounts, setMockAccounts] = useState<MockUser[]>([]);

  // Mock-account bridge (UC07.2): registered landlords live in the mock auth
  // store, not in the admin seed list — without this merge they never appear
  // here, so approving them was impossible and a registered landlord stayed
  // PENDING_VERIFICATION forever. Synthetic ids are negative so they never
  // collide with the admin seed ids; status changes write back to mock auth.
  // Read in an effect (not during render) so the server-rendered list and
  // the hydrated list match until the browser store is available.
  useEffect(() => {
    const sync = () => {
      setMockAccounts(listMockAccounts());
    };
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const displayUsers: AdminUser[] = useMemo(() => {
    const known = new Set(users.map((u) => u.email.toLowerCase()));
    const extra = mockAccounts
      .filter((account): account is MockUser & { role: 'LANDLORD' | 'TENANT' } => account.role !== 'ADMIN' && !known.has(account.email.toLowerCase()))
      .map((account, index) => ({
        id: -(1000 + index),
        name: account.fullName,
        email: account.email,
        phone: account.phoneNumber,
        role: account.role,
        status: account.status,
        joinedAt: '—',
      } satisfies AdminUser));
    return [...users, ...extra];
  }, [users, mockAccounts]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<number>(() => users.find((u) => u.status === 'LOCKED')?.id ?? users[0]?.id ?? 0);
  const [lockTarget, setLockTarget] = useState<AdminUser | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<AdminUser | null>(null);
  const [rejectVerifyTarget, setRejectVerifyTarget] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Dashboard "Cần chú ý" deep-links here with ?status=PENDING_VERIFICATION.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    if (s === 'PENDING_VERIFICATION' || s === 'ACTIVE' || s === 'LOCKED') {
      setStatusFilter(s);
      if (s === 'PENDING_VERIFICATION') setRole('LANDLORD');
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return displayUsers.filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (q && !`${u.name} ${u.email} ${u.phone} ${u.house ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [displayUsers, query, role, statusFilter]);

  const selected = filtered.find((u) => u.id === selectedId) ?? displayUsers.find((u) => u.id === selectedId) ?? filtered[0];
  const pendingCount = displayUsers.filter((u) => u.status === 'PENDING_VERIFICATION').length;
  const landlordCount = displayUsers.filter((u) => u.role === 'LANDLORD').length;
  const tenantCount = displayUsers.filter((u) => u.role === 'TENANT').length;

  const updateUser = (id: number, patch: Partial<AdminUser>) => {
    const target = displayUsers.find((u) => u.id === id);
    if (patch.status && target) {
      // Synthetic (mock-auth) accounts: the mock store is the source of truth.
      // Seed accounts: also mirror to mock auth when the same email exists
      // there, so a lock/verification is not undone by the other store.
      setMockAccountStatusByEmail(target.email, patch.status);
      setMockAccounts(listMockAccounts());
    }
    if (id >= 0) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const confirmLockToggle = () => {
    if (!lockTarget) return;
    const wasLocked = lockTarget.status === 'LOCKED';
    const prevStatus = lockTarget.status;
    updateUser(lockTarget.id, { status: wasLocked ? 'ACTIVE' : 'LOCKED' });
    appendAudit(setAuditExtra, wasLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản', lockTarget.email);
    push(
      wasLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      lockTarget.name,
      { label: 'Hoàn tác', onClick: () => updateUser(lockTarget.id, { status: prevStatus }) },
    );
  };

  const confirmApproveLandlord = () => {
    if (!verifyTarget) return;
    updateUser(verifyTarget.id, { status: 'ACTIVE', verificationReason: undefined });
    appendAudit(setAuditExtra, 'Xác minh chủ trọ', verifyTarget.email);
    push('Đã xác minh chủ trọ', verifyTarget.name, {
      label: 'Hoàn tác',
      onClick: () => updateUser(verifyTarget.id, { status: 'PENDING_VERIFICATION' }),
    });
  };

  const confirmRejectLandlord = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Lý do từ chối xác minh là bắt buộc.');
      return;
    }
    if (!rejectVerifyTarget) return;
    const target = rejectVerifyTarget;
    // Backend reject-landlord keeps the account but not verified; model as LOCKED
    // with the reason stored, so the decision is visible and reversible via Hoàn tác.
    updateUser(target.id, { status: 'LOCKED', verificationReason: reason });
    appendAudit(setAuditExtra, 'Từ chối xác minh chủ trọ', target.email);
    push('Đã từ chối xác minh chủ trọ', `${target.name} · Lý do: ${reason}`, {
      label: 'Hoàn tác',
      onClick: () => updateUser(target.id, { status: 'PENDING_VERIFICATION', verificationReason: undefined }),
    });
    setRejectVerifyTarget(null);
    setRejectReason('');
    setRejectError('');
  };

  const chip = (active: boolean) =>
    cn('h-7 rounded-full px-3 text-xs font-medium', active ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Quản lý người dùng</h1>
      <p className="mt-1 text-sm text-muted">
        {displayUsers.length} tài khoản{pendingCount > 0 ? ` · ${pendingCount} chủ trọ chờ xác minh` : ''}
      </p>
      <p className="mt-1 text-[13px] text-muted">Danh sách gộp tài khoản mẫu của Admin và tài khoản đã đăng ký trên bản mock — duyệt chủ trọ tại đây sẽ kích hoạt luôn tài khoản đăng ký đó.</p>

      {/* Search + filters */}
      <div className="mt-5 space-y-3">
        <Input
          name="userSearch"
          type="search"
          placeholder="Tìm theo tên, email, số điện thoại, nhà…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setRole('all')} className={chip(role === 'all')}>Tất cả · {displayUsers.length}</button>
          <button type="button" onClick={() => setRole('LANDLORD')} className={chip(role === 'LANDLORD')}>Chủ trọ · {landlordCount}</button>
          <button type="button" onClick={() => setRole('TENANT')} className={chip(role === 'TENANT')}>Khách thuê · {tenantCount}</button>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <button type="button" onClick={() => setStatusFilter('all')} className={chip(statusFilter === 'all')}>Mọi trạng thái</button>
          <button type="button" onClick={() => setStatusFilter('ACTIVE')} className={chip(statusFilter === 'ACTIVE')}>Đang hoạt động</button>
          <button type="button" onClick={() => setStatusFilter('LOCKED')} className={chip(statusFilter === 'LOCKED')}>Đã khóa</button>
          <button type="button" onClick={() => setStatusFilter('PENDING_VERIFICATION')} className={chip(statusFilter === 'PENDING_VERIFICATION')}>Chờ xác minh · {pendingCount}</button>
        </div>
        <p className="text-[13px] text-muted" aria-live="polite">Hiển thị {filtered.length} / {displayUsers.length}</p>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="px-5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">TÀI KHOẢN</div>
        <div className="divide-y divide-line">
          {filtered.map((u) => {
            const isSelected = selected?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedId(u.id)}
                className={cn('flex w-full items-center gap-3.5 px-5 py-3.5 text-left', isSelected && 'bg-primary-soft/40')}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
                  {initialsOf(u.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{u.name}</span>
                  <span className="block truncate text-[13px] text-muted">
                    {u.role === 'LANDLORD' ? `Chủ trọ · ${u.house ?? ''}` : 'Khách thuê'} · {u.email}
                  </span>
                  <span className="block truncate text-[13px] text-muted">Tham gia {u.joinedAt}</span>
                </span>
                {statusBadge(u)}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted">Không có tài khoản nào khớp bộ lọc.</p>
          )}
        </div>
      </Card>

      {selected && (
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{selected.name}</p>
              <p className="mt-1 text-sm text-muted">{selected.email} · {selected.phone}</p>
              {selected.role === 'LANDLORD' && selected.house && (
                <p className="mt-1 text-sm text-muted">{selected.house}{selected.rooms ? ` · ${selected.rooms} phòng` : ''}</p>
              )}
            </div>
            {statusBadge(selected)}
          </div>
          <p className="mt-3 text-sm text-muted">
            {selected.status === 'LOCKED' && (selected.verificationReason
              ? `Xác minh chủ trọ bị từ chối: ${selected.verificationReason}`
              : 'Tài khoản đang bị khóa — người dùng không thể đăng nhập.')}
            {selected.status === 'PENDING_VERIFICATION' && 'Chủ trọ này đang chờ xác minh. Duyệt để tài khoản hoạt động đầy đủ, hoặc từ chối kèm lý do.'}
            {selected.status === 'ACTIVE' && 'Tài khoản đang hoạt động bình thường.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {selected.status === 'PENDING_VERIFICATION' ? (
              <>
                <Button onClick={() => setVerifyTarget(selected)}>Duyệt xác minh chủ trọ</Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:border-red-500 hover:text-red-700"
                  onClick={() => {
                    setRejectReason('');
                    setRejectError('');
                    setRejectVerifyTarget(selected);
                  }}
                >
                  Từ chối xác minh
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setLockTarget(selected)}>
                {selected.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </Button>
            )}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={lockTarget != null}
        title={lockTarget?.status === 'LOCKED' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        description={
          lockTarget
            ? lockTarget.status === 'LOCKED'
              ? `Tài khoản ${lockTarget.name} (${lockTarget.email}) sẽ đăng nhập và sử dụng Roomix trở lại ngay. Hành động được ghi vào nhật ký và có thể hoàn tác.`
              : `Tài khoản ${lockTarget.name} (${lockTarget.email}) sẽ bị khóa ngay — người dùng không thể đăng nhập cho tới khi Admin mở khóa. Hành động được ghi vào nhật ký và có thể hoàn tác.`
            : ''
        }
        confirmLabel={lockTarget?.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
        danger={lockTarget?.status !== 'LOCKED'}
        onConfirm={confirmLockToggle}
        onCancel={() => setLockTarget(null)}
      />

      <ConfirmDialog
        open={verifyTarget != null}
        title="Duyệt xác minh chủ trọ?"
        description={verifyTarget ? `${verifyTarget.name} (${verifyTarget.email}) sẽ trở thành chủ trọ đã xác minh và đăng bài đầy đủ. Hành động được ghi vào nhật ký và có thể hoàn tác.` : ''}
        confirmLabel="Duyệt xác minh"
        onConfirm={confirmApproveLandlord}
        onCancel={() => setVerifyTarget(null)}
      />

      <Modal open={rejectVerifyTarget != null} onClose={() => setRejectVerifyTarget(null)} title="Từ chối xác minh chủ trọ" widthClass="max-w-md">
        <p className="text-sm leading-relaxed text-muted">
          {rejectVerifyTarget ? `${rejectVerifyTarget.name} sẽ không được xác minh chủ trọ. ` : ''}Lý do là bắt buộc và sẽ được lưu lại kèm quyết định.
        </p>
        <label htmlFor="verify-reject-reason" className="mt-4 block text-[13px] font-semibold text-ink">Lý do từ chối *</label>
        <textarea
          id="verify-reject-reason"
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectError) setRejectError('');
          }}
          rows={3}
          placeholder="Ví dụ: Giấy tờ nhà chưa rõ, thông tin chưa khớp…"
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {rejectError && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{rejectError}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setRejectVerifyTarget(null)}>Hủy</Button>
          <Button type="button" variant="danger" onClick={confirmRejectLandlord}>Từ chối xác minh</Button>
        </div>
      </Modal>
    </div>
  );
}
