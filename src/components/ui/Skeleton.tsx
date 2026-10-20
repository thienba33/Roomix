import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[#EBEBEB]', className)} />;
}

export function SkeletonCard() {
  return (
    <div>
      <Skeleton className="aspect-[3/2] w-full rounded-[14px]" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <Skeleton className="mt-2.5 h-6 w-24 rounded-full" />
    </div>
  );
}
export default Skeleton;
