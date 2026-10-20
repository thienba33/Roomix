'use client';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePostsState, type LPost } from '@/lib/landlord-store';
import type { PostStatus } from '@/types';
import { cn, formatPriceShort, formatVND, postStatusLabel } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type Filter = PostStatus | 'ALL';
const listLabel: Record<PostStatus, string> = { ...postStatusLabel, APPROVED: 'Đang hiển thị', REJECTED: 'Bị từ chối' };
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'APPROVED', label: listLabel.APPROVED }, { key: 'PENDING', label: listLabel.PENDING },
  { key: 'DRAFT', label: listLabel.DRAFT }, { key: 'REJECTED', label: listLabel.REJECTED }, { key: 'HIDDEN', label: listLabel.HIDDEN },
];
const statusText: Record<PostStatus, string> = { APPROVED: 'text-green-700', PENDING: 'text-amber-700', DRAFT: 'text-gray-500', REJECTED: 'text-red-600', HIDDEN: 'text-gray-500' };

function ListingsInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const [posts, setPosts] = usePostsState();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editPost, setEditPost] = useState<LPost | null>(() => editParam ? null : null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');

  // open edit from ?edit=id once posts hydrated
  const editFromParam = editParam && !editPost ? posts.find((p) => p.id === Number(editParam)) : undefined;
  if (editFromParam && editTitle === '') { /* handled via button below */ }

  const filtered = posts.filter((p) => (filter === 'ALL' || p.status === filter)).filter((p) => !search.trim() || p.title.toLowerCase().includes(search.trim().toLowerCase()) || p.roomCode.includes(search.trim()));
  const liveCount = posts.filter((p) => p.status === 'APPROVED').length;

  const updateStatus = (post: LPost, next: PostStatus, msg: string) => {
    const prev = posts;
    setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, status: next } : p)));
    toast.push(msg, post.title, { label: 'Hoàn tác', onClick: () => setPosts(prev) });
  };
  const doDelete = () => {
    if (deleteId === null) return;
    const target = posts.find((p) => p.id === deleteId); const prev = posts;
    setPosts((list) => list.filter((p) => p.id !== deleteId)); setDeleteId(null);
    toast.push('Đã xóa bài đăng', target?.title, { label: 'Hoàn tác', onClick: () => setPosts(prev) });
  };
  const openEdit = (p: LPost) => { setEditPost(p); setEditTitle(p.title); setEditPrice(String(p.price)); setEditDesc(p.description ?? ''); setEditError(''); };
  const saveEdit = () => {
    if (!editPost) return;
    if (!editTitle.trim()) { setEditError('Tiêu đề không được để trống'); return; }
    if (!editPrice || Number(editPrice) <= 0) { setEditError('Giá phải > 0'); return; }
    const prev = posts; const id = editPost.id;
    setPosts((list) => list.map((p) => (p.id === id ? { ...p, title: editTitle.trim(), price: Number(editPrice), description: editDesc } : p)));
    setEditPost(null);
    toast.push('Đã lưu bài đăng', editTitle, { label: 'Hoàn tác', onClick: () => setPosts(prev) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-[28px] font-extrabold text-ink">Bài đăng</h1><p className="mt-1 text-sm text-muted">{posts.length} bài · {liveCount} đang hiển thị · Hiển thị {filtered.length} / {posts.length}</p></div>
        <Link href="/landlord/listings/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark">+ Tạo bài đăng</Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => { const count = f.key === 'ALL' ? posts.length : posts.filter((p) => p.status === f.key).length; return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cn('rounded-full px-4 py-2 text-sm transition', filter === f.key ? 'bg-primary-soft font-semibold text-primary-dark' : 'font-medium text-muted hover:bg-page hover:text-ink')}>{f.label} ({count})</button> ); })}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tiêu đề / mã phòng…" aria-label="Tìm bài đăng" className="h-10 w-64 rounded-full border border-line px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>
      {filtered.length === 0 ? (<Card className="p-10 text-center text-sm text-muted">{search ? `Không tìm thấy bài đăng khớp "${search}".` : 'Chưa có bài đăng nào ở trạng thái này.'}</Card>) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[1fr_100px_90px_110px_240px] gap-4 border-b border-line/70 px-5 pb-3 pt-4 sm:grid"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Bài đăng</span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Phòng</span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Giá</span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Trạng thái</span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Thao tác</span></div>
          <div className="divide-y divide-line/70">
            {filtered.map((post) => (
              <div key={post.id} className="px-5 py-3.5">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_100px_90px_110px_240px]">
                  <div className="flex min-w-0 items-center gap-3.5"><Image src={post.image} alt={post.title} width={96} height={96} className="h-12 w-12 shrink-0 rounded-lg object-cover" /><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-ink">{post.title}</h3><p className="mt-0.5 text-[13px] text-muted">Đăng {post.createdAt} · {post.views} lượt xem</p></div></div>
                  <span className="hidden text-sm text-muted sm:block">Phòng {post.roomCode}</span><span className="hidden text-sm text-muted sm:block">{formatPriceShort(post.price)}</span>
                  <span className={cn('text-sm font-semibold', statusText[post.status])}>{listLabel[post.status]}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openEdit(post)}>Sửa</Button>
                    {post.status === 'DRAFT' && <Button size="sm" onClick={() => updateStatus(post, 'PENDING', 'Đã gửi duyệt bài đăng')}>Gửi duyệt</Button>}
                    {post.status === 'REJECTED' && <Button size="sm" onClick={() => updateStatus(post, 'PENDING', 'Đã gửi duyệt lại')}>Gửi lại</Button>}
                    {post.status === 'APPROVED' && <Button size="sm" variant="outline" onClick={() => updateStatus(post, 'HIDDEN', 'Đã ẩn bài đăng')}>Ẩn</Button>}
                    {post.status === 'HIDDEN' && <Button size="sm" variant="outline" onClick={() => updateStatus(post, 'APPROVED', 'Đã hiện bài đăng')}>Hiện</Button>}
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(post.id)}>Xóa</Button>
                  </span>
                </div>
                {post.status === 'REJECTED' && post.rejectReason && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">Lý do từ chối: {post.rejectReason}</p>}
                {editFromParam?.id === post.id && <p className="mt-2 text-[13px] text-primary">Nhấn &quot;Sửa&quot; để chỉnh bài này (mở từ Tạo bài đăng).</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
      <p className="text-[12px] text-muted">Ghi chú: Backend chưa có DELETE /landlords/rooms — xóa ở đây là xóa cục bộ (mock) kèm Hoàn tác.</p>
      <ConfirmDialog open={deleteId !== null} title="Xóa bài đăng?" description="Bài đăng sẽ bị xóa khỏi danh sách của bạn. Thao tác này có thể hoàn tác ngay qua nút Hoàn tác trong thông báo." confirmLabel="Xóa bài đăng" danger onConfirm={doDelete} onCancel={() => setDeleteId(null)} />
      <Modal open={editPost !== null} onClose={() => setEditPost(null)} title="Sửa bài đăng" widthClass="max-w-xl">
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-[13px] font-semibold text-ink">Tiêu đề <span className="text-red-600">*</span></label><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="mb-1.5 block text-[13px] font-semibold text-ink">Giá (đ/tháng) <span className="text-red-600">*</span></label><input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{editPrice && Number(editPrice) > 0 && <p className="mt-1 text-[12px] text-muted">{formatVND(Number(editPrice))}</p>}</div>
          <div><label className="mb-1.5 block text-[13px] font-semibold text-ink">Mô tả</label><textarea rows={4} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          {editError && <p className="text-[13px] font-medium text-red-600" role="alert">{editError}</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditPost(null)}>Hủy</Button><Button onClick={saveEdit}>Lưu thay đổi</Button></div>
        </div>
      </Modal>
    </div>
  );
}

export default function BaiDangPage() {
  return (<Suspense fallback={<p className="text-sm text-muted">Đang tải…</p>}><ListingsInner /></Suspense>);
}
