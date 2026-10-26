'use client';
import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { listUsers, updateUser, USERS_EVENT, type AdminUser } from '@/services/backend/admin';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
const EMPTY: AdminUser[] = [];
type Action = Parameters<typeof updateUser>[1];
const labels: Record<Action, string> = { lock: 'Khóa', unlock: 'Mở khóa', 'approve-landlord': 'Duyệt chủ trọ', 'reject-landlord': 'Từ chối' };
export default function UsersPage() {
  const { data: users, ready, error, retry } = useApiData('users', listUsers, EMPTY, USERS_EVENT);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
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
  const filtered = users.filter((item) => (!role || item.role === role) && `${item.fullName} ${item.email} ${item.username}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Quản lý tài khoản</h1><div className="flex flex-wrap gap-3"><Input aria-label="Tìm tài khoản" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, email hoặc tên đăng nhập…" /><select aria-label="Vai trò" value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-line px-3 py-2"><option value="">Khách thuê và chủ trọ</option><option value="TENANT">Khách thuê</option><option value="LANDLORD">Chủ trọ</option></select></div>{!ready ? <p role="status">Đang tải tài khoản…</p> : error ? <div role="alert"><p>{error}</p><Button onClick={retry}>Thử lại</Button></div> : <div className="divide-y divide-line rounded-2xl border border-line">{filtered.length ? filtered.map((user) => <article key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><h2 className="break-words font-semibold">{user.fullName}</h2><p className="break-all text-sm text-muted">{user.username} · {user.email}</p><p className="mt-1 text-xs text-muted">{user.role} · {user.status}</p></div><div className="flex gap-2">{user.role !== 'ADMIN' && (user.status === 'PENDING_VERIFICATION' ? (['approve-landlord', 'reject-landlord'] as const) : ([user.status === 'LOCKED' ? 'unlock' : 'lock'] as const)).map((action) => <Button key={action} size="sm" variant="outline" onClick={() => { setTarget({ user, action }); setReason(''); setFailure(''); }}>{labels[action]}</Button>)}</div></article>) : <p className="p-6 text-muted">Không có tài khoản phù hợp.</p>}</div>}<Modal open={!!target} onClose={() => { if (!busy) setTarget(null); }} title={target ? `${labels[target.action]} tài khoản` : ''}><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}><p>{target?.user.fullName}</p>{target?.action === 'reject-landlord' && <Input label="Lý do từ chối" required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />}{failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}<Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></form></Modal></section>;
}
