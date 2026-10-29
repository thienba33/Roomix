'use client';
import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { listUsers, updateUser, USERS_EVENT, type AdminUser } from '@/services/backend/admin';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { USER_STATUS_LABELS, formatAdminDate } from './presentation';
const EMPTY: AdminUser[] = [];
type Action = Parameters<typeof updateUser>[1];
const titles: Record<Action, string> = { lock: 'Khóa tài khoản', unlock: 'Mở khóa tài khoản', 'approve-landlord': 'Duyệt chủ trọ', 'reject-landlord': 'Từ chối chủ trọ' };
const labels: Record<Action, string> = { lock: 'Khóa', unlock: 'Mở khóa', 'approve-landlord': 'Duyệt chủ trọ', 'reject-landlord': 'Từ chối' };
export default function UsersWorkspace({ initialRole = '', initialStatus = '', initialSearch = '' }: { initialRole?: string; initialStatus?: string; initialSearch?: string }) {
  const { data: users, ready, error, retry } = useApiData('users', listUsers, EMPTY, USERS_EVENT);
  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [target, setTarget] = useState<{ user: AdminUser; action: Action } | null>(null);
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!target || busy) return;
    setBusy(true); setFailure('');
    try { await updateUser(target.user.id, target.action, reason); setTarget(null); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Không thể cập nhật tài khoản.'); }
    finally { setBusy(false); }
  };
  const filtered = users.filter((item) => (!role || item.role === role) && (!status || item.status === status) && `${item.fullName} ${item.email} ${item.username}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="admin-users space-y-5">
    <h1 className="text-2xl font-bold">Người dùng</h1>
    <div className="admin-user-filters admin-user-filters-expanded">
      <Input aria-label="Tìm tài khoản" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, email hoặc tên đăng nhập…" />
      <select aria-label="Vai trò" value={role} onChange={(event) => setRole(event.target.value)} className="border border-line px-3 py-2"><option value="">Tất cả vai trò</option><option value="TENANT">Khách thuê</option><option value="LANDLORD">Chủ trọ</option></select>
      <select aria-label="Trạng thái tài khoản" value={status} onChange={(event) => setStatus(event.target.value)} className="border border-line px-3 py-2"><option value="">Tất cả trạng thái</option>{Object.entries(USER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
    {!ready ? <p role="status">Đang tải tài khoản…</p> : error ? <div role="alert"><p>{error}</p><Button onClick={retry}>Thử lại</Button></div> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{filtered.length} tài khoản</p>{(search || role || status) && <button type="button" className="text-sm font-semibold text-primary" onClick={() => { setSearch(''); setRole(''); setStatus(''); }}>Xóa bộ lọc</button>}</div>
      {filtered.length ? <div className="admin-account-table-wrap"><table className="admin-account-table">
        <caption className="sr-only">Danh sách tài khoản</caption>
        <thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{filtered.map((user) => <tr key={user.id}>
          <td data-label="Tài khoản"><strong className="block font-semibold">{user.fullName}</strong><span className="mt-1 block text-xs text-muted">{user.username}</span><span className="mt-1 block text-xs text-muted">{user.email}</span></td>
          <td data-label="Vai trò">{user.role === 'LANDLORD' ? 'Chủ trọ' : user.role === 'TENANT' ? 'Khách thuê' : user.role}</td>
          <td data-label="Trạng thái"><Badge tone={user.status === 'ACTIVE' ? 'green' : user.status === 'LOCKED' ? 'red' : 'amber'} dot>{USER_STATUS_LABELS[user.status] ?? user.status}</Badge></td>
          <td data-label="Ngày tạo"><time dateTime={user.createdAt}>{formatAdminDate(user.createdAt)}</time></td>
          <td><div className="flex flex-wrap gap-2">{user.role !== 'ADMIN' && (user.status === 'PENDING_VERIFICATION' ? (['approve-landlord', 'reject-landlord'] as const) : ([user.status === 'LOCKED' ? 'unlock' : 'lock'] as const)).map((action) => <Button key={action} size="sm" variant="outline" onClick={() => { setTarget({ user, action }); setReason(''); setFailure(''); }}>{labels[action]}</Button>)}</div></td>
        </tr>)}</tbody>
      </table></div> : <p className="border-y border-line py-10 text-center text-sm text-muted">Không có tài khoản phù hợp.</p>}
    </>}
    <Modal contentClassName="admin-dialog" open={!!target} onClose={() => { if (!busy) setTarget(null); }} title={target ? titles[target.action] : ''}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div><p className="font-semibold">{target?.user.fullName}</p><p className="mt-1 break-all text-sm text-muted">{target?.user.email}</p></div>
        {target?.action === 'reject-landlord' && <Input label="Lý do từ chối" required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />}
        {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setTarget(null)}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : target ? labels[target.action] : 'Xác nhận'}</Button></div>
      </form>
    </Modal>
  </section>;
}
