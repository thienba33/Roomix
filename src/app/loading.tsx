import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Image src="/images/logo.png" alt="Roomix" width={56} height={56} className="animate-pulse" />
      <p className="text-sm text-muted">Đang tải...</p>
    </div>
  );
}
