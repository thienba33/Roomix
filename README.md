<p align="center">
  <img src="public/images/logo.png" alt="Roomix" width="240" />
</p>

# Roomix

Nền tảng tìm kiếm và quản lý phòng trọ, kết nối người thuê với chủ trọ.

- **Người thuê:** tìm phòng, lưu yêu thích và gửi yêu cầu thuê.
- **Chủ trọ:** quản lý phòng, bài đăng, khách thuê và hóa đơn.
- **Quản trị viên:** kiểm duyệt bài đăng và quản lý người dùng.

### Chạy dự án

```bash
git clone https://github.com/thienba33/Roomix.git
cd Roomix
npm install
npm run dev
```


### Kết nối backend local

FE gọi API thật qua gateway; dữ liệu nghiệp vụ không còn dùng fixture hoặc mock localStorage.
Backend mặc định: `http://localhost:18080`.

```bash
cp .env.example .env.local
npm run dev
```

Đặt `API_URL` trong `.env.local` nếu gateway đổi địa chỉ, rồi khởi động lại Next.js.
Request từ browser đi qua `/backend/api/...` (Next rewrite) tới gateway.
Đăng nhập bằng tài khoản trong database backend; tài khoản demo cũ không còn hiệu lực.
Chủ trọ đăng ký mới phải được Admin phê duyệt theo backend.

Đã nối: xác thực/hồ sơ, tìm/chi tiết phòng, yêu thích, yêu cầu thuê, hợp đồng,
hóa đơn, thông báo, quản lý tài khoản và kiểm duyệt bài đăng. Chatbot tạm khóa theo quyết định người dùng: RAG chưa kiểm tra quyền xem liên hệ sau ACCEPTED.

Repo backend mới đã có CRUD nhà/tầng cho chủ trọ; màn Nhà & Phòng gọi các API này.
Nếu gateway vẫn dùng image cũ, cần dựng lại core-service để các route mới xuất hiện trong Swagger.
Giới hạn API hiện tại: chưa có danh sách phòng/tin nháp riêng của chủ trọ,
xóa phòng/tin, hồ sơ chủ trọ công khai, Contact Card, cập nhật hồ sơ/mật khẩu,
báo cáo, broadcast và đọc audit log. Các màn tương ứng hiển thị chưa hỗ trợ.
API tạo/sửa/gửi duyệt/ẩn/hiện phòng đã có adapter; màn quản lý tin vẫn chờ API đọc.
Hóa đơn phân biệt `SETTLEMENT` với thu tiền mặt/chuyển khoản; thống kê thực thu chưa gồm dòng tiền quyết toán.
Thống kê tài chính tổng hợp từ hóa đơn thật và chi tiết phòng được phép xem; nhà chưa truy được hiển thị chưa xác định.

Kiểm tra: `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build`.
Các script QA mock cũ trong workspace là bằng chứng lịch sử, không áp dụng cho chế độ API thật.
