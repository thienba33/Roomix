import Button from './Button';
export default function Pagination({ page, totalPages, totalElements, onChange, disabled = false }: {
  page: number; totalPages: number; totalElements: number; onChange: (page: number) => void; disabled?: boolean;
}) {
  return <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
    <p role="status" className="text-muted">{totalElements} kết quả · Trang {totalPages ? page + 1 : 0}/{totalPages}</p>
    <div className="flex gap-2"><Button size="sm" variant="outline" disabled={disabled || page <= 0} onClick={() => onChange(page - 1)}>Trang trước</Button><Button size="sm" variant="outline" disabled={disabled || page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Trang sau</Button></div>
  </nav>;
}
