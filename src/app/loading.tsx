import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-12 w-auto animate-pulse" />
      <p className="text-sm text-muted">Đang tải...</p>
    </div>
  );
}
