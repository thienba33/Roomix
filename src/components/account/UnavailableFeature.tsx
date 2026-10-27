import Link from 'next/link';
export default function UnavailableFeature({ title, description, href = '/', linkLabel = 'Về trang tìm phòng' }: { title: string; description: string; href?: string; linkLabel?: string }) {
  return <section className="space-y-4 rounded-2xl border border-line p-6 sm:p-8"><h1 className="text-2xl font-bold">{title}</h1><p role="status" className="max-w-2xl text-sm leading-6 text-muted">{description}</p><Link href={href} className="inline-block text-sm font-semibold text-primary hover:underline">{linkLabel}</Link></section>;
}
