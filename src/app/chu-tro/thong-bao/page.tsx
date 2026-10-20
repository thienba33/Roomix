import { notificationsLandlord } from '@/lib/data';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';

const typeVisual: Record<NotificationType, { bg: string; dot: string }> = {
  INTEREST_REQUEST: { bg: 'bg-primary-soft', dot: 'bg-primary' },
  INVOICE: { bg: 'bg-red-50', dot: 'bg-red-500' },
  POST_APPROVAL: { bg: 'bg-green-50', dot: 'bg-green-500' },
  SYSTEM: { bg: 'bg-gray-100', dot: 'bg-gray-400' },
  GENERAL: { bg: 'bg-amber-50', dot: 'bg-amber-500' },
};

export default function ThongBaoPage() {
  const unreadCount = notificationsLandlord.filter((n) => !n.read).length;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Thông báo</h1>
        <p className="mt-1 text-sm text-muted">{unreadCount} thông báo chưa đọc</p>
      </div>

      <Card className="divide-y divide-line/70 overflow-hidden p-0">
        {notificationsLandlord.map((n) => {
          const visual = typeVisual[n.type];
          return (
            <div key={n.id} className={cn('flex gap-3.5 px-5 py-4', !n.read && 'bg-primary-soft/40')}>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', visual.bg)}>
                <span className={cn('h-2.5 w-2.5 rounded-full', visual.dot)} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-ink', !n.read ? 'font-bold' : 'font-medium')}>{n.title}</p>
                <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-[13px] text-muted">{n.time}</span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
