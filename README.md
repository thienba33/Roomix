# Roomix — Frontend

Frontend của **Roomix — hệ thống cho thuê phòng trọ thông minh**, xây dựng bằng Next.js + Tailwind CSS. Giao diện bám sát thiết kế Figma "Roomix — UI Design": 3 luồng riêng biệt cho **Khách thuê / Chủ trọ / Admin**, theme trắng, màu chủ đạo Indigo `#4F46E5`, font Plus Jakarta Sans, bố cục marketplace kiểu Airbnb cho khách thuê và top-navigation cho chủ trọ / admin.

Dữ liệu hiện tại là dữ liệu mẫu tập trung tại `src/lib/data.ts`, truy cập qua lớp `src/services/api.ts` — đây là điểm nối để thay bằng API backend thật (`NEXT_PUBLIC_API_URL`, mặc định `http://localhost:8080`) mà không cần sửa component.

## Công nghệ

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** (design tokens khai báo trong `src/styles/globals.css`)
- **Plus Jakarta Sans** qua `next/font/google` (latin + vietnamese)
- Dữ liệu mẫu / mock service layer — chưa nối backend thật

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm run start    # chạy bản build
```

Sao chép `.env.example` thành `.env.local` nếu cần đổi địa chỉ backend:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Cấu trúc thư mục

```
public/images/          Ảnh phòng (rooms/), logo, icon AI
src/
  app/                  App Router: layout gốc, trang chủ, loading/error/404, api/hello
  components/
    ui/                 Button, Input, Badge, Card, Modal, Drawer, Skeleton, Toast, Charts (SVG)
    layouts/            TenantHeader + AiPanel, HostTopbar, AdminTopbar, Footer, TenantShell,
                        RoomCard, FilterModal, RejectModal, InvoiceDrawer
  lib/data.ts           Nguồn dữ liệu mẫu duy nhất (phòng, bài đăng, hóa đơn, người dùng...)
  lib/utils.ts          cn(), formatVND(), formatPriceShort(), nhãn trạng thái
  services/api.ts       Lớp service (hiện trả mock, sẵn sàng đổi sang fetch backend)
  hooks/                useDebounce, useOnClickOutside, useToggle
  styles/globals.css    Tailwind v4 + design tokens (Indigo / sea gradient)
  types/index.ts        Room, Post, Invoice, Tenant, NotificationItem...
```

## Ánh xạ màn hình Figma → Route

### Khách thuê (Tenant)

| Mã | Màn hình | Route / Component |
|----|----------|-------------------|
| A1 | Tìm phòng (trang chủ) | `/` |
| A2 | Chi tiết phòng | `/phong/[id]` |
| A3 | Panel AI (trạng thái component) | Component `AiPanel` + route `/ai` |
| A4 | Yêu cầu của tôi | `/yeu-cau` |
| A5 | Đăng nhập | `/login` |
| — | Đăng ký | `/register` |
| A6 | Bộ lọc (trạng thái component) | Component `FilterModal` |
| A7 | Trạng thái / thông báo | `/trang-thai` |
| A8 | Hồ sơ & Phòng yêu thích | `/yeu-thich` |
| A9 | Menu người dùng (trạng thái component) | Dropdown trong `TenantHeader` |

### Chủ trọ (Landlord)

| Mã | Màn hình | Route / Component |
|----|----------|-------------------|
| B1 | Hôm nay (tổng quan) | `/chu-tro` |
| B2 | Nhà & Phòng | `/chu-tro/phong` |
| B3 | Bài đăng | `/chu-tro/bai-dang` |
| B4 | Tạo bài đăng | `/chu-tro/bai-dang/tao` |
| B5 | Yêu cầu quan tâm | `/chu-tro/yeu-cau` |
| B12 | Từ chối yêu cầu (trạng thái component) | Component `RejectModal` |
| B6 | Khách thuê | `/chu-tro/khach-thue` |
| B7 | Hóa đơn | `/chu-tro/hoa-don` |
| B13 | Chi tiết hóa đơn (trạng thái component) | Component `InvoiceDrawer` |
| B8 | Thống kê | `/chu-tro/thong-ke` |
| B9 | Thông báo | `/chu-tro/thong-bao` |
| B10 | Hồ sơ chủ trọ | `/chu-tro/ho-so` |
| B11 | Đăng nhập chủ trọ | `/chu-tro/dang-nhap` |

### Admin

| Mã | Màn hình | Route / Component |
|----|----------|-------------------|
| C1 | Đăng nhập Admin (kèm xác thực khuôn mặt) | `/admin/dang-nhap` |
| C2 | Tổng quan | `/admin` |
| C3 | Kiểm duyệt bài đăng | `/admin/kiem-duyet` |
| C7 | Chi tiết kiểm duyệt | `/admin/kiem-duyet/[id]` |
| C4 | Quản lý người dùng | `/admin/nguoi-dung` |
| C5 | Báo cáo vi phạm | `/admin/bao-cao` |
| C6 | Thông báo & Audit log | `/admin/thong-bao` |

> A3, A6, A9, B12, B13 là các trạng thái/component dùng lại (panel, modal, drawer, dropdown) chứ không phải route riêng — A3 có thêm route `/ai` để mở trực tiếp.
