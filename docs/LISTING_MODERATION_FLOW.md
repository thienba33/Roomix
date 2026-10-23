# Đợt 4 — Quản lý phòng và kiểm duyệt tin (mock)

Cập nhật 23/10/2026. Mô phỏng theo LandlordRoomController, LandlordRoomRequest, LandlordRoomServiceImpl và AdminPostServiceImpl trong core-service; không gọi HTTP.

## Luồng đã triển khai

- Chủ trọ dùng tài khoản `landlord_demo`, admin dùng `admin_demo`; mật khẩu `Roomix123!`. Vai trò được kiểm tra tại mock service cho mỗi thao tác.
- Tạo phòng đồng thời tạo tin DRAFT. Chọn nhà/tầng được cấp, nhập số phòng, diện tích, giá, sức chứa, tiện ích, tiêu đề, mô tả, tiền cọc, ngày có thể thuê và ảnh.
- Lưu nháp có thể chưa có ảnh hoặc giá bằng 0. Gửi duyệt yêu cầu diện tích và giá > 0 cùng ít nhất một ảnh.
- DRAFT/REJECTED → PENDING; admin chỉ được APPROVE/REJECT khi PENDING. Từ chối bắt buộc có lý do.
- Chỉ DRAFT/REJECTED được chỉnh sửa. Sửa REJECTED đưa về DRAFT và xóa lý do cũ. Ảnh mới nối thêm vào ảnh cũ, không có thao tác xóa ảnh riêng.
- APPROVED → HIDDEN → APPROVED qua ẩn/hiện. Không có nút xóa tin, hoàn tác quyết định hoặc đổi tùy ý trạng thái phòng.
- Bảng quản lý hiển thị riêng trạng thái phòng và trạng thái tin. Số tin chờ duyệt ở sidebar/dashboard admin và số tin nháp ở dashboard chủ trọ đọc cùng kho.
- Trang tìm phòng, yêu thích, chi tiết cập nhật theo kho chung qua sự kiện trong tab và storage event giữa các tab. Ẩn/từ chối tin loại khỏi public; duyệt và còn trống thì xuất hiện trong tìm kiếm.
- Chi tiết chuyển sang đọc mock trên client để tin mới tạo vẫn mở được sau reload. Tin không được duyệt hiển thị trạng thái không khả dụng (không phải HTTP 404 từ server).
- Admin đăng nhập bằng username/password; bỏ bước face scan vì backend chưa có endpoint nghiệp vụ face-auth.

## Dữ liệu

`roomix_mock_catalog_v1` lưu toàn bộ phòng/tin, UUID, chủ sở hữu, trạng thái, lý do và dữ liệu chi tiết. Ban đầu seed từ roomFixtures; không nhập các kho landlord/admin cũ vì chúng có ID và quyết định mâu thuẫn. Cập nhật thất bại do quota phải hiển thị lỗi thay vì báo thành công.

Nhà/tầng cấp sẵn từ propertyFixtures. Backend chưa có API quản lý/list nhà-tầng dành riêng chủ trọ; đây là dữ liệu bổ trợ cho UI mock, không tự tạo hợp đồng API mới. Tài khoản không có nhà/tầng nhận trạng thái rỗng.

Ảnh local được chuyển sang data URL để preview và lưu cùng mock; form giới hạn 1 MB/ảnh trong bản trải nghiệm. Không phải upload thật, không giả định đây là giới hạn backend. Chưa mô phỏng notification/audit phát ra khi admin quyết định; các module đó thuộc đợt tiếp theo.

## Giới hạn còn lại

- Trang admin/users và duyệt tài khoản chủ trọ vẫn dùng kho cũ; đợt này chỉ nối admin đăng nhập và duyệt tin. Dùng landlord_demo để chạy luồng.
- Dữ liệu thống kê tổng hợp/dashboard khác vẫn là fixture cũ; chỉ số tin chờ duyệt/nháp đã đồng bộ.
- Cập nhật đợt 5a: phòng mới được duyệt đã hỗ trợ yêu cầu thuê/hợp đồng/cọc qua UUID và kho chung. Hóa đơn vẫn thuộc đợt sau; xem `RENTAL_FLOW.md`.
- Mock chạy trên trình duyệt, không thay thế phân quyền server hoặc tính nguyên tử giao dịch khi nhiều tab cùng ghi.

## Kiểm tra

Đã chạy kiểm tra service: tạo nháp, thiếu ảnh không gửi duyệt được, thêm ảnh và gửi duyệt, không sửa tin pending, kiểm tra vai trò, lý do từ chối, sửa tin rejected thành draft, duyệt tin, từ chối thao tác trên trạng thái cũ, đồng bộ public và yêu thích khi ẩn/hiện. Kiểm tra lint phần thay đổi, TypeScript và build production. Chưa kiểm tra trực quan trong trình duyệt.
