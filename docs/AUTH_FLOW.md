# Luồng xác thực Roomix

- Khách thuê, chủ trọ và Admin dùng API Core qua rewrite `/backend/api/...`; cấu hình gateway bằng `API_URL`.
- Đăng nhập thông thường dùng username/password. Đăng ký công khai chỉ dành cho TENANT/LANDLORD; chủ trọ chờ xác minh nếu backend yêu cầu.
- `/admin/login` giữ hai phương thức: mật khẩu và khuôn mặt. Cả hai kiểm tra quyền ADMIN và trạng thái ACTIVE qua `/api/users/me` trước khi lưu vào phiên API chung, để các màn hình quản trị gửi đúng Bearer token.
- Các route Admin kiểm tra phiên và quyền qua AuthProvider chung. Đăng xuất xóa phiên chung và thông tin phương thức đăng nhập Admin.
- `/admin/face` yêu cầu đăng nhập bằng mật khẩu tại `/admin/login` trong lần mở ứng dụng hiện tại trước khi đăng ký/thay khuôn mặt. Tải lại trang vẫn giữ phiên API nếu hợp lệ, nhưng cần đăng nhập mật khẩu lại để đăng ký mặt.
- Luồng khuôn mặt giữ phiên LOGIN/ENROLL, completionToken, camera, hủy thao tác và đọc lại kết quả. Face không tự cấp JWT; Core phải hoàn tất xác thực.
- Phiên API dùng `roomix_api_session_v1`; không sử dụng token mock. Cơ chế refresh của adapter chung phụ thuộc API và cookie backend đang triển khai.

Các endpoint phiên khuôn mặt `/api/auth/face/sessions`, `/api/auth/face/complete` và `/api/face/**` cần được backend/gateway cung cấp. Nếu thiếu, giao diện báo lỗi; đăng nhập mật khẩu vẫn độc lập.
