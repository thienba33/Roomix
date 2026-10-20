'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { usersAdminLandlords, usersAdminTenants } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { UserAccount } from '@/types';

type Tab = 'landlords' | 'tenants';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('landlords');
  const [landlords, setLandlords] = useState<UserAccount[]>(usersAdminLandlords);
  const [tenants, setTenants] = useState<UserAccount[]>(usersAdminTenants);

  const rows = tab === 'landlords' ? landlords : tenants;

  const toggleLock = (id: number) => {
    const flip = (list: UserAccount[]) =>
      list.map((u) => (u.id === id ? { ...u, status: u.status === 'ACTIVE' ? ('LOCKED' as const) : ('ACTIVE' as const) } : u));
    if (tab === 'landlords') setLandlords((p) => flip(p));
    else setTenants((p) => flip(p));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-muted">Chủ trọ và khách thuê trên hệ thống Roomix</p>
        </div>

        {/* Segmented control */}
        <div className="inline-flex rounded-full border border-line bg-page p-1" role="tablist" aria-label="Nhóm người dùng">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'landlords'}
            onClick={() => setTab('landlords')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === 'landlords' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            Chủ trọ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tenants'}
            onClick={() => setTab('tenants')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === 'tenants' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            Khách thuê
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-page text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3.5 font-semibold">Người dùng</th>
                <th className="px-5 py-3.5 font-semibold">SĐT</th>
                <th className="px-5 py-3.5 font-semibold">Ngày tham gia</th>
                <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                <th className="px-5 py-3.5 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const locked = u.status === 'LOCKED';
                return (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-page/60">
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary-dark">
                          {initialsOf(u.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{u.name}</span>
                          <span className="block truncate text-[13px] text-muted">{u.email}</span>
                          {u.house && <span className="block truncate text-xs text-muted">{u.house}{u.rooms ? ` · ${u.rooms} phòng` : ''}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-ink">{u.phone}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted">{u.joinedAt}</td>
                    <td className="px-5 py-4">
                      {locked ? <Badge tone="red" dot>Đã khóa</Badge> : <Badge tone="green" dot>Hoạt động</Badge>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => toggleLock(u.id)}>
                        {locked ? 'Mở khóa' : 'Khóa'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Hiển thị {rows.length} {tab === 'landlords' ? 'chủ trọ' : 'khách thuê'}
        </p>
      </Card>
    </div>
  );
}
