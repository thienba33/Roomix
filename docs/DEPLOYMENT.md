# Deploy Roomix lên Render

Roomix cần **Web Service / Node**, vì có App Router, route động và tối ưu ảnh của Next.js.

Cấu hình service kết nối repository `thienba33/Roomix`, nhánh `main`:

| Thiết lập | Giá trị |
| --- | --- |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Root Directory | Để trống nếu dùng thư mục gốc repository |

`next start` tự đọc biến `PORT` mà Render cung cấp và mặc định lắng nghe trên `0.0.0.0`.

## Lựa chọn bundler

Script `npm run build` chủ động dùng `next build --webpack`. Cấu hình Webpack trong `next.config.mjs` đã nối Tailwind loader vào chuỗi CSS của Next.js để build có đầy đủ giao diện.

Commit `636905f` vẫn dùng `next build` mặc định với Turbopack. Log Render ngày 21/10/2026 báo 20 lỗi từ font Plus Jakarta Sans, cùng thông báo `next/font/google queries have exactly one entry` và không resolve được module font nội bộ của Turbopack. Đổi script production sang Webpack tránh đường build gặp lỗi này; không cần cài package nội bộ `@vercel/turbopack-next`.

Sau khi GitHub có bản sửa, deploy commit mới nhất. Log đúng sẽ hiển thị `next build --webpack` và `Next.js 16.4.2 (webpack)`. Nếu đang dùng build cache của lần lỗi, chọn **Clear build cache & deploy** trong thao tác deploy thủ công của Render.

Việc cài dependency thành công, cảnh báo `npm audit` và thông báo thiếu build cache không phải bước làm deployment này dừng lại. Không dùng `npm audit fix --force` để xử lý lỗi bundler/font.

## Kiểm tra trước khi deploy

```bash
npx tsc --noEmit --incremental false
npm run lint
npm run build
npm start
```

Các luồng sản phẩm hiện vẫn dùng mock và storage trong trình duyệt; deploy frontend chưa kết nối backend thật. Google Fonts vẫn được tải ở bước build, nên môi trường build cần truy cập được máy chủ font.

Tham khảo: [Next.js CLI](https://nextjs.org/docs/app/api-reference/cli/next), [Render — Deploy a Next.js App](https://render.com/docs/deploy-nextjs-app).
