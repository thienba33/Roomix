# Luồng tài khoản — Admin HTTP, tenant/landlord mock

Cập nhật 24/10/2026: `/admin/login` chuyển sang HTTP Core, xem
`ADMIN_AUTH_INTEGRATION.md`. Phần tenant/landlord dưới đây vẫn dùng mock;
`src/services/mock/auth.ts` mô phỏng hành vi AuthServiceImpl và cấu trúc
AuthResponse. Mock không phải hệ thống xác thực bảo mật.

## Giao diện

- Popup đăng nhập dùng username/password. Bỏ lựa chọn vai trò khi đăng nhập; vai trò lấy từ tài khoản trong phản hồi mock.
- Đăng ký vẫn chọn khách thuê/chủ trọ. Tenant ACTIVE nhận phiên sử dụng ngay; landlord PENDING_VERIFICATION không nhận token và thấy màn hình chờ duyệt.
- Kiểm tra trùng username/email, sai mật khẩu, tài khoản khóa/chờ duyệt. Có trạng thái gửi và chống gửi lặp khi đang xử lý.
- Bỏ Google, quên mật khẩu, ghi nhớ đăng nhập khỏi luồng đang dùng vì chưa có hợp đồng backend hỗ trợ. Component ForgotPasswordForm được giữ để dùng sau.
- Đăng xuất desktop/mobile chủ trọ và khách thuê xóa phiên mock. Header hiển thị tên tài khoản trong phiên.
- `/login`, `/register` vẫn mở popup trên nền trang tìm phòng. Tham số role chỉ chọn sẵn vai trò đăng ký, không cấp quyền đăng nhập.
- `/admin/login` có hai lựa chọn độc lập: mật khẩu và khuôn mặt. Cả hai nhận JWT qua Core và kiểm tra /api/users/me; phiên mock không mở khu vực Admin. Đăng ký mặt tại /admin/face yêu cầu phiên đăng nhập mật khẩu. Các API phiên Face/hoàn tất LOGIN đã kiểm tra qua Core/Gateway và webcam thật local/Docker; xem ADMIN_AUTH_INTEGRATION.md. Tài khoản chủ trọ đăng ký qua mock vẫn chờ duyệt.

## Tài khoản trải nghiệm

Mật khẩu chung `Roomix123!`:

| Username | Vai trò | Trạng thái |
|---|---|---|
| tenant_demo | TENANT | ACTIVE |
| landlord_demo | LANDLORD | ACTIVE |
| pending_demo | LANDLORD | PENDING_VERIFICATION |
| locked_demo | TENANT | LOCKED |
| admin_demo | ADMIN (fixture cũ, không dùng tại /admin/login) | ACTIVE |

## Dữ liệu và giới hạn

- `roomix_mock_accounts_v1`: tài khoản đăng ký trên trình duyệt; mật khẩu demo lưu fingerprint SHA-256, không lưu nguyên văn. Đây không phải cơ chế bảo mật production.
- `roomix_mock_session_v1`: user, token giả có tiền tố mock-only và thời hạn 1 giờ. Kiểm tra khi tải trang, storage event và mỗi 30 giây. Không gửi token này tới API thật.
- Mô phỏng thời hạn phiên 1 giờ là lựa chọn của fixture, không phải xác nhận cấu hình JWT backend đang chạy.
- Dữ liệu nghiệp vụ phòng/thuê/hóa đơn vẫn là fixture cũ theo vai trò, chưa tách theo tài khoản mới. Các route nghiệp vụ vẫn phục vụ preview, chưa có bảo vệ truy cập thật. Không coi kết quả mock là xác thực/quyền server.
- Backend response còn có avatarUrl/timestamps; mock hiện chỉ trả các trường UI đang dùng. Vỏ ApiResponse sẽ được bổ sung khi chuẩn hóa adapter các module.

## Các đợt tiếp theo — vẫn dùng mock

1. Phòng/tìm kiếm/yêu thích: UUID, pagination, trạng thái, bộ lọc đúng hợp đồng.
2. Quản lý phòng/tin và admin: dữ liệu chung cho đăng ký–duyệt chủ trọ, chuyển trạng thái kiểm duyệt.
3. Yêu cầu thuê, hợp đồng, đặt cọc, hóa đơn, khiếu nại, quyết toán.
4. Thông báo và AI theo hợp đồng hiện có.

Chỉ chuyển adapter sang HTTP khi môi trường backend đã sẵn sàng. Khi đó xác thực và cấp quyền do server quyết định.

Trang `/admin/login` không hiển thị đăng ký hoặc tài khoản demo khách thuê/chủ trọ. ADMIN cần tài khoản thật đã được cấp trong Core. Đăng ký công khai chỉ nhận TENANT/LANDLORD ở cả kiểu TypeScript và kiểm tra runtime. Không tạo tài khoản Admin từ frontend.
