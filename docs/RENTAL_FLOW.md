# Đợt 5a — Yêu cầu thuê, hợp đồng và cọc (mock)

Đối chiếu SendRentalRequest, AcceptRentalRequest, ReasonRequest, RentalRequestServiceImpl, TenancyServiceImpl và ReservationExpiryService trong rental-service. Chưa gọi HTTP hoặc chạy backend.

## Đã thực hiện

- Gửi yêu cầu từ chi tiết phòng bằng UUID, kể cả phòng mới tạo và được admin duyệt. Lời nhắn tối đa 2000 ký tự; chặn yêu cầu trùng, phòng không khả dụng và phòng có hợp đồng PENDING/ACTIVE.
- `/requests`: khách xem yêu cầu và hợp đồng của mình; hủy yêu cầu PENDING, hủy hợp đồng chờ cọc với lý do.
- `/landlord/requests`: chủ trọ xem yêu cầu thuộc mình, từ chối với lý do hoặc chấp nhận và nhập đủ điều khoản: ngày bắt đầu/kết thúc, tiền thuê/cọc, đơn giá điện/nước, chỉ số đầu, điều khoản và hạn cọc.
- Chấp nhận tạo hợp đồng PENDING, chuyển yêu cầu ACCEPTED và từ chối những yêu cầu PENDING khác cho cùng phòng. Không có thao tác hoàn tác giả.
- `/landlord/tenants` đổi tên hiển thị thành Hợp đồng: xem điều khoản, hủy hợp đồng chờ cọc hoặc xác nhận đã nhận cọc. Xác nhận chuyển ACTIVE và cập nhật trạng thái phòng OCCUPIED; tìm phòng và yêu thích cùng phản ánh thay đổi.
- Ngày bắt đầu từ hôm nay và ngày phòng có thể thuê; ngày kết thúc sau ngày bắt đầu. Tiền thuê > 0, các số khác >= 0; tối đa 13 chữ số nguyên và 2 số lẻ. Hạn cọc mặc định 24 giờ, phải trong tương lai và không sau ngày kết thúc.
- Chờ cọc không tự đặt core RoomStatus thành RESERVED: đúng luồng backend, phòng còn có thể xuất hiện trong tìm kiếm nhưng gửi yêu cầu mới bị chặn bởi hợp đồng đang mở.
- Hết hạn cọc tự hiển thị CANCELLED khi đọc; hook kiểm tra mỗi 15 giây. Trạng thái suy ra được ghi vào storage ở lần thay đổi tiếp theo.

## Dữ liệu và giới hạn

`roomix_mock_rental_v1` chứa requests và tenancies dùng chung; mỗi thao tác kiểm tra tài khoản/vai trò/quyền sở hữu và trạng thái. Sự kiện local đồng bộ màn hình, storage event đồng bộ các tab. Kho khởi đầu rỗng để không trộn yêu cầu mẫu cũ với tài khoản mới. Các hook cũ vẫn phục vụ module chưa chuyển đổi.

Đây là mô phỏng trình duyệt, không phải xác thực bảo mật hay khóa giao dịch giữa nhiều tab. Không có Kafka/outbox thật; occupancy được chiếu từ hợp đồng ACTIVE lên catalog. Không thực hiện chuyển tiền hay phát thông báo/contact card thật.

Hóa đơn, công tơ, khiếu nại, quyết toán và kết thúc thuê thuộc đợt kế tiếp. Chưa cung cấp nút kết thúc vì backend yêu cầu quyết toán hợp lệ. Các màn hình hóa đơn/thống kê cũ chưa liên kết với hợp đồng mới.

## Cách kiểm tra

1. Đăng nhập tenant_demo / Roomix123!, mở phòng khả dụng và gửi yêu cầu.
2. Đăng xuất, đăng nhập landlord_demo / Roomix123!, mở Yêu cầu, chấp nhận và nhập điều khoản.
3. Vào Hợp đồng, xác nhận cọc; tìm kiếm không còn phòng đó.
4. Đăng nhập lại tenant_demo, xem hợp đồng đang thuê trong Yêu cầu của tôi; tải lại trang vẫn giữ dữ liệu.
5. Với hợp đồng khác, thử hủy khi chờ cọc, lý do trống, ngày không hợp lệ và hạn cọc đã qua.

Kiểm tra service bằng Node + TypeScript transpilation trong file tạm ngoài repo: phòng mới/UUID, cách ly tài khoản, cạnh tranh yêu cầu, dữ liệu không hợp lệ, hủy, hết hạn, xác nhận cọc lặp lại và đồng bộ occupancy/yêu thích. Chưa kiểm tra trực quan trong trình duyệt; không bổ sung test runner vào dự án.

Kết quả kiểm tra đợt này: service checks đạt, TypeScript và ESLint các file thay đổi đạt. ESLint toàn repo còn 9 lỗi ở các module cũ ngoài phạm vi. Production build thử hai lần đều dừng tại Next.js `Could not parse output from TypeScript's --showConfig` (Unexpected end of JSON input); chạy trực tiếp `tsc --showConfig` xuất JSON bình thường. Chưa xác nhận build thành công trong môi trường hiện tại.

## Tách trang khách thuê

`/requests` chỉ hiển thị yêu cầu thuê; `/contracts` chỉ hiển thị hợp đồng của khách thuê. Hai mục điều hướng desktop/mobile chỉ hiện sau khi đăng nhập TENANT. Hồ sơ có liên kết riêng; yêu cầu ACCEPTED dẫn tới trang hợp đồng. Backend GET `/api/tenancies` và GET `/api/tenancies/{id}` cho phép đọc hợp đồng thuộc người dùng, nên khách thuê vẫn cần màn hình này. Quyền xác nhận cọc vẫn chỉ dành cho chủ trọ; khách chỉ có thể hủy hợp đồng PENDING với lý do.
