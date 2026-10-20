'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { usersAdmin, usersAdminLandlords, usersAdminTenants } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { UserAccount } from '@/types';

type Tab = 'landlords' | 'tenants';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

function defaultSelectedId(list: UserAccount[]): number {
  const locked = list.find((u) => u.status === 'LOCKED');
  return (locked ?? list[0])?.id ?? 0;
}

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('landlords');
  const [landlords, setLandlords] = useState<UserAccount[]>(usersAdminLandlords);
  const [tenants, setTenants] = useState<UserAccount[]>(usersAdminTenants);
  const [selectedId, setSelectedId] = useState<number>(() => defaultSelectedId(usersAdminLandlords));

  const rows = tab === 'landlords' ? landlords : tenants;
  const selected = rows.find((u) => u.id === selectedId) ?? rows[0];

  const handleTabChange = (next: Tab) => {
    setTab(next);
    const nextRows = next === 'landlords' ? landlords : tenants;
    setSelectedId(defaultSelectedId(nextRows));
  };

  const toggleLock = (id: number) => {
    const flip = (list: UserAccount[]) =>
      list.map((u) => (u.id === id ? { ...u, status: u.status === 'ACTIVE' ? ('LOCKED' as const) : ('ACTIVE' as const) } : u));
    if (tab === 'landlords') setLandlords((p) => flip(p));
    else setTenants((p) => flip(p));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Quản lý người dùng</h1>
      <p className="mt-1 text-sm text-muted">{usersAdmin.length} tài khoản</p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('landlords')}
          className={cn(
            'h-7 rounded-full px-3 text-xs font-medium',
            tab === 'landlords' ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted',
          )}
        >
          Chủ trọ · {usersAdminLandlords.length}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('tenants')}
          className={cn(
            'h-7 rounded-full px-3 text-xs font-medium',
            tab === 'tenants' ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted',
          )}
        >
          Khách thuê · {usersAdminTenants.length}
        </button>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="px-5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">TÀI KHOẢN</div>
        <div className="divide-y divide-line">
          {rows.map((u) => {
            const locked = u.status === 'LOCKED';
            const isSelected = selected?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedId(u.id)}
                className={cn(
                  'flex w-full items-center gap-3.5 px-5 py-3.5 text-left',
                  isSelected && 'bg-primary-soft/40',
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
                  {initialsOf(u.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{u.name}</span>
                  <span className="block truncate text-[13px] text-muted">
                    {tab === 'landlords' ? `Chủ trọ · ${u.house ?? ''}` : 'Khách thuê'}
                  </span>
                  <span className="block truncate text-[13px] text-muted">Tham gia {u.joinedAt}</span>
                </span>
                <span
                  className={cn('shrink-0 text-[13px] font-semibold', locked ? 'text-[#B91C1C]' : 'text-[#15803D]')}
                >
                  {locked ? 'Đã khóa' : 'Đang hoạt động'}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="mt-5 p-5">
          <p className="font-semibold text-ink">Đã chọn: {selected.name}</p>
          <p className="mt-1 text-sm text-muted">
            {selected.status === 'LOCKED'
              ? 'Tài khoản bị khóa sau 2 báo cáo vi phạm đã xác nhận.'
              : 'Tài khoản đang hoạt động bình thường.'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => toggleLock(selected.id)}>
            {selected.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          </Button>
        </Card>
      )}
    </div>
  );
}
