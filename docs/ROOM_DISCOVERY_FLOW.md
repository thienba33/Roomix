# Đợt 3 — Tìm phòng, chi tiết và yêu thích (mock)

Cập nhật 22/10/2026. Không gọi HTTP, không cần backend đang chạy.

## Nguồn hợp đồng

Đối chiếu `core-service` trong `../Roomix_Backend`:

- `dtos/request/RoomSearchRequest.java`.
- `dtos/response/RoomSummaryResponse.java`, `RoomDetailResponse.java`, `FavoriteResponse.java`, `PageResponse.java`.
- `services/impl/RoomQueryServiceImpl.java`, `FavoriteServiceImpl.java`.
- `repositories/PostRepository.java` (điều kiện public visibility).

Mock service `src/services/mock/rooms.ts` trả payload DTO trực tiếp; chưa bọc ApiResponse HTTP. Mock không cấp quyền bảo mật thật.

## Hành vi giao diện

- Tìm kiếm theo đường/phường/quận/thành phố. Giá từ/đến bằng VND, diện tích tối thiểu, tiện ích. Ba kiểu sắp xếp: newest, price_asc, price_desc.
- Bỏ loại phòng tự suy từ diện tích, diện tích tối đa, sắp xếp diện tích và sao đánh giá vì không thuộc hợp đồng API này.
- Tìm kiếm chỉ hiển thị post APPROVED, room AVAILABLE, rented=false. Với fixture cũ, chỉ 302 và 405 thỏa điều kiện; 510 PENDING, 201 DRAFT, 303 REJECTED, 102 HIDDEN.
- Phân trang từ 0 trong service, từ 1 trên giao diện, chọn 1/2/4/8/20 phòng mỗi trang. Đổi tiêu chí đặt lại trang 0; kiểm tra minPrice <= maxPrice, minArea > 0, size 1–100. Có trạng thái khởi tạo, rỗng và lỗi.
- Bộ lọc lưu tại `roomix_mock_room_search_v1`; AI áp tiêu chí vào cùng khóa này và phát sự kiện để trang đang mở cập nhật. Các yêu cầu AI chưa lọc được tiếp tục hiển thị ghi chú.
- Chi tiết dùng `/rooms/{UUID}`. Link số cũ của tin APPROVED chuyển sang UUID; tin không hợp lệ/không được duyệt hiển thị trạng thái không khả dụng trên client (cập nhật đợt 4).
- Chi tiết hiển thị tiền thuê, tiền cọc, sức chứa, ngày có thể thuê, địa chỉ, ảnh và mô tả. Bỏ tổng phí điện/nước tự tính, danh tính/điện thoại chủ trọ và danh sách “phòng khác của chủ trọ” vì DTO không có các dữ liệu đó.
- Chi tiết và yêu thích tuân theo backend: yêu cầu post APPROVED; available được tính từ !rented. Điều này khác bộ lọc tìm kiếm còn yêu cầu roomStatus=AVAILABLE. Không tự đồng nhất hai điều kiện.

## Yêu thích

- Khách chưa đăng nhập lưu/bỏ yêu thích trên trình duyệt qua `roomix_guest_favorites_v1`. Sau đăng nhập TENANT, gộp với danh sách tài khoản theo postId, giữ mục cũ và loại trùng. Chủ trọ/admin không nhận danh sách tạm.
- Thêm/xóa nhận roomId UUID, bản ghi lưu postId. Có favoriteId UUID, createdAt và RoomSummary.
- Trùng yêu thích báo lỗi; xóa mục không tồn tại báo lỗi; tin chưa duyệt không thêm được; danh sách chỉ lấy tin còn APPROVED.
- Lưu riêng tại `roomix_mock_favorites_v1:{userId}`. Đăng xuất không xóa yêu thích; đăng nhập lại khôi phục danh sách. Không tự nhập danh sách mock số cũ vì danh sách đó không gắn tài khoản.
- Đồng bộ giữa thẻ phòng, chi tiết, trang yêu thích và các tab qua sự kiện local/storage/auth.

## Ranh giới của đợt này

- Ảnh/giá/phòng lấy từ fixture cũ, ID phòng/tin/nhà/tầng được ánh xạ sang UUID. Tiền cọc một tháng, sức chứa 2 người, ngày có thể thuê 01/11/2026 là dữ liệu mẫu bổ sung, không phải quy tắc mặc định của backend.
- Đợt 4 đã nối kho chung `roomix_mock_catalog_v1` cho chủ trọ/admin/public; xem `LISTING_MODERATION_FLOW.md`. Các kho localStorage cũ không được tự nhập.
- Cập nhật đợt 5a: gửi yêu cầu thuê dùng UUID và kho rental chung theo tài khoản; xem `RENTAL_FLOW.md`.
- AI gợi ý vẫn là module cũ; chỉ cầu nối áp bộ lọc và link số → UUID được hỗ trợ. Không coi đợt này là tích hợp RAG.

## Kiểm tra

Kiểm tra service bằng Node + TypeScript transpilation: lọc public visibility, địa chỉ/giá/diện tích/tiện ích, phân trang và sắp xếp, chi tiết không hợp lệ, yêu thích trùng/xóa, cách ly hai tài khoản, từ chối chủ trọ và khách chưa đăng nhập. TypeScript/lint phần sửa/build được chạy riêng. Chưa có kiểm tra trình duyệt tự động.

## Bổ sung yêu thích cho khách chưa đăng nhập

- Menu desktop/mobile ẩn Yêu cầu của tôi cho đến khi đăng nhập TENANT. Truy cập URL `/requests` trực tiếp vẫn yêu cầu đăng nhập.
- Trang yêu thích hiển thị danh sách tạm và lời nhắc đăng nhập, không bắt đăng nhập khi bấm tim.
- AuthProvider thử gộp khi tải phiên và khi đăng nhập, gồm cả sau đăng ký tài khoản khách thuê. Chỉ chuyển các tin còn APPROVED. Ghi danh sách tài khoản thành công trước khi xóa danh sách tạm; nếu lỗi, giữ tạm và hiển thị nút thử lại. Gộp lại không nhân bản mục cũ.
- Đăng xuất không sao chép danh sách riêng của tài khoản ra danh sách khách. Danh sách tạm thuộc trình duyệt, không đồng bộ sang thiết bị khác.
- Đây là bổ sung UX phía FE; backend vẫn yêu cầu TENANT cho API yêu thích. Khi tích hợp thật, cần gửi từng roomId lên API, xử lý trùng và chỉ xóa mục tạm sau khi server xác nhận thành công; không gọi endpoint khi khách chưa đăng nhập.
