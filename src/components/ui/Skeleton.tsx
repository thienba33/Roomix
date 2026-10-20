import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-page', className)} />;
}

export function SkeletonCard() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}
export default Skeleton;
