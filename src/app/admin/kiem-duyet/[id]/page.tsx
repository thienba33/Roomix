import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { moderationQueue, posts, rooms } from '@/lib/data';
import { formatVND } from '@/lib/utils';

const CHECKLIST = ['Ảnh hợp lệ', 'Giá khớp khu vực', 'Không chứa thông tin cấm'];

const DESCRIPTION_SAMPLE =
  'Phòng khép kín, đầy đủ nội thất cơ bản: giường, tủ, bàn học, điều hòa, nóng lạnh. Khu vực an ninh, giờ giấc tự do, có chỗ để xe rộng rãi. Gần trường đại học và các tuyến xe buýt chính.';

function landlordFor(post: { roomId: number }): string {
  const map: Record<number, string> = {
    302: 'Nguyễn Văn An',
    405: 'Trần Thu Hằng',
    510: 'Lê Minh Đức',
    102: 'Nguyễn Văn An',
    303: 'Nguyễn Văn An',
    201: 'Trần Thị Mai',
  };
  return map[post.roomId] ?? 'Chủ trọ Roomix';
}

export default async function ModerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = [...moderationQueue, ...posts];
  const post = all.find((p) => String(p.id) === String(id));
  if (!post) notFound();

  const room = rooms.find((r) => r.id === post.roomId);
  const gallery = room?.gallery && room.gallery.length > 0 ? room.gallery : [post.image];
  const mainImage = gallery[0] ?? post.image;
  const thumbs = gallery.slice(1, 4);
  const amenities = room?.amenities ?? ['Điều hòa', 'Wifi', 'WC riêng', 'Nóng lạnh'];
  const size = room?.size;
  const floor = room?.floor;

  return (
    <div>
      <Link href="/admin/kiem-duyet" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        Quay lại
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        {/* LEFT — Photos + listing info */}
        <div className="min-w-0">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-page">
            <Image src={mainImage} alt={post.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 700px" priority />
          </div>

          {thumbs.length > 0 && (
            <div className="mt-3 flex gap-3">
              {thumbs.map((src) => (
                <div key={src} className="relative h-24 w-36 overflow-hidden rounded-xl border border-line bg-page">
                  <Image src={src} alt={post.title} fill className="object-cover" sizes="144px" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">{post.title}</h1>
            <p className="mt-2 text-[15px] text-secondary">
              {formatVND(post.price)}/tháng
              {size ? ` · ${size}m²` : ''}
              {floor ? ` · Tầng ${floor}` : ''}
              {` · ${post.area}`}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              Chủ trọ: {landlordFor(post)} · Đăng {post.createdAt}
            </p>

            <p className="mt-4 max-w-[560px] text-sm leading-relaxed text-ink/80">{DESCRIPTION_SAMPLE}</p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-ink">Tiện ích</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="rounded-full bg-page px-3 py-1.5 text-[13px] font-medium text-ink">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Moderation panel */}
        <div>
          <Card className="sticky top-24 p-6">
            <h2 className="text-[17px] font-bold text-ink">Kiểm duyệt</h2>

            <ul className="mt-4 space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <Badge tone="green" className="px-4 py-1.5">Rủi ro thấp</Badge>
            </div>

            <div className="mt-5">
              <Input name="rejectReason" placeholder="Lý do từ chối (nếu có)" />
            </div>

            <div className="mt-5 flex gap-3">
              <Link href="/admin/kiem-duyet" className="flex-1">
                <Button className="w-full">Duyệt bài</Button>
              </Link>
              <Link href="/admin/kiem-duyet" className="flex-1">
                <Button variant="outline" className="w-full border-red-300 text-red-600 hover:border-red-500 hover:text-red-700">
                  Từ chối
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              Hành động kiểm duyệt sẽ được ghi vào nhật ký hoạt động.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
