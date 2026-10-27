# Đăng nhập Admin qua Core

Trang `/admin/login` gọi HTTP thật và kiểm tra hồ sơ ADMIN ACTIVE qua Core.
Mật khẩu và khuôn mặt cùng lưu token vào phiên API chung để các màn hình
quản trị sử dụng. Sau đăng nhập mở `/admin`; đăng ký mặt ở `/admin/face`.
Tenant và landlord cũng dùng adapter API, không dùng phiên mock.

## Cấu hình

Trong `.env.local` của frontend:

```dotenv
API_URL=http://localhost:18080
```

Trình duyệt gọi cùng origin qua `/backend/api/...`; Next.js rewrite đến
Gateway. Khởi động lại frontend sau khi đổi cấu hình. Cả Core và Face dùng
chung đường dẫn này; không đặt bí mật backend vào biến NEXT_PUBLIC.

## Hợp đồng cần xác nhận với người làm Core

Core trong checkout hiện đã có module `auth` triển khai hai API dưới đây,
đã kiểm thử cùng PostgreSQL riêng. Chưa chạy qua frontend/Gateway hoặc
database Core của người dùng. Hướng dẫn tại `core-service/docs/ADMIN_AUTH.md`.

1. `POST /api/auth/login` với `{username, password}` trả
   `{accessToken, tokenType: "Bearer", expiresIn}`. expiresIn tính bằng giây.
2. `GET /api/users/me`, header Authorization Bearer, trả
   `{id, username, fullName, email, role, status}`.

Để thử Core trực tiếp, đặt API_URL=http://localhost:8081 và khởi động lại
frontend. Core trực tiếp không proxy /api/face; toàn luồng cần Gateway.

Cả hai chấp nhận DTO trực tiếp hoặc bọc trong `{data: ...}`. Nếu vỏ có
`success: false`, client từ chối. Nếu Core dùng kiểu bọc khác, điều chỉnh
adapter sau khi đối chiếu response thực tế, không tự đoán phiên hợp lệ.

Client kiểm tra role ADMIN/status ACTIVE từ /me trước khi tạo phiên UI.
Token mock bị từ chối. Không mở camera hoặc gọi Face khi đăng nhập mật khẩu.
Core vẫn phải kiểm tra mật khẩu, quyền/trạng thái và xác thực JWT tại mỗi
API; kiểm tra giao diện không thay thế việc kiểm tra ở server.

## Đăng ký khuôn mặt

Menu Admin có `/admin/face`. Sau đăng nhập mật khẩu, người dùng bấm Bắt đầu:

1. Frontend gọi `POST /api/auth/face/sessions`, header Bearer JWT và body
   `{purpose: "ENROLL"}`. Không gửi adminId từ trình duyệt.
2. Core trả `{authSessionId, purpose: "ENROLL", expiresAt}` trực tiếp hoặc
   trong `{data: ...}`. expiresAt là Unix seconds. Nếu backend chưa cung cấp
   endpoint, giao diện báo API chưa sẵn sàng và không tạo phiên cục bộ.
3. Client mở camera rồi gọi `/api/face/challenges` qua Gateway với phiên
   ENROLL và JWT; ảnh được gửi tuần tự qua `/api/face/challenges/{id}/frames`.
4. Chỉ báo thành công khi Face trả SUCCEEDED, nghĩa là hồ sơ đã được lưu.

Core phải kiểm tra JWT thuộc Admin không khóa và được đăng nhập bằng mật
khẩu; không tin cờ method trong trình duyệt. Quyền này tiếp tục được kiểm
tra ở API nội bộ khi Face bắt đầu và báo kết quả. Không bỏ qua Core.

`src/services/face-camera.mjs` dùng lại client từ Face Service
`src/face_auth/web/face_camera.mjs`, kèm bộ kiểm thử camera tương ứng; không
chứa mô hình AI hoặc xử lý nhận dạng trong frontend. Nếu sửa client dùng
chung, đối chiếu cả hai nơi và chạy lại test. Không có bản Face backend mới.

Camera không thu âm, không lật dữ liệu ảnh; hướng dẫn trái/phải dựa trên ảnh
gốc. Dừng/rời trang/phiên UI hết hạn sẽ đóng camera. Camera chỉ dùng được ở
localhost hoặc HTTPS. Nút Đọc lại kết quả không gửi lại ảnh hay tạo phiên mới.
Nếu kết quả là CORE_PENDING thì chưa được coi là đăng ký thành công.

Đăng ký lại thành công thay hồ sơ của cùng Admin. Ảnh Telegram do backend
quyết định theo cấu hình; frontend không gọi Telegram hoặc giữ token bot.
Chưa kiểm chứng webcam người thật hoặc API Core thật trong chặng này.

## Đăng nhập khuôn mặt

Trang `/admin/login` có hai lựa chọn độc lập. Chọn mật khẩu không mở camera
hoặc gọi Face. Chọn khuôn mặt không yêu cầu nhập username/password.

Luồng khuôn mặt cần các endpoint sau từ Core/Gateway:

1. `POST /api/auth/face/sessions`, body `{purpose: "LOGIN"}`, không JWT,
   trả `{authSessionId, purpose: "LOGIN", expiresAt, completionToken}`.
   completionToken do Core sinh ngẫu nhiên mật mã, đề xuất 32 byte entropy,
   biểu diễn base64url hoặc hex. Client chấp nhận 32–256 ký tự A-Z/a-z/0-9/_/-.
2. Frontend chỉ gửi authSessionId/purpose đến Face. Không gửi completionToken
   hoặc token nội bộ sang Face. Nhận dạng 1:N không dùng ID tự khai.
3. Khi Face trả SUCCEEDED, frontend gọi `POST /api/auth/face/complete`, body
   `{authSessionId, completionToken}`. Core kiểm tra bí mật nhận JWT, phiên,
   thời hạn, kết quả callback Face được xác thực nội bộ, quyền ADMIN và khóa.
   Không tin `verified`, `adminId` hoặc trạng thái Face do trình duyệt tự khai.
4. Core trả AuthResponse (accessToken/tokenType/expiresIn), trực tiếp hoặc
   trong data. Frontend gọi /api/users/me, chỉ tạo phiên UI với ADMIN ACTIVE.

completionToken ràng buộc quyền nhận JWT với trình duyệt tạo phiên. Không
được trả trong API validate nội bộ hoặc GET trạng thái Face. Core không cấp
JWT chỉ dựa vào authSessionId. Không log body có completionToken hoặc JWT.

Khi mất response cuối, nút Đọc lại kết quả đọc cùng challenge; nếu Face đã
SUCCEEDED thì thử hoàn tất cùng phiên/mã bí mật. Core cần xử lý complete
idempotent, trả lại cùng phiên/JWT chưa hết hạn, không tạo thêm lần đăng nhập
hoặc thông báo. Phiên chưa có kết quả Face phải bị Core từ chối. Frontend
không tự đăng nhập bằng kết quả Face đơn lẻ và không tự cấp JWT.

Thời hạn tạo phiên/hoàn tất cần thống nhất để có thể đọc lại kết quả trong
thời gian còn hiệu lực. Nếu hết hạn, tạo phiên mới. Mã phiên và completionToken
chỉ giữ trong bộ nhớ; không đưa vào URL/localStorage/sessionStorage. Dừng
camera vẫn cho phép đọc lại kết quả, rời trang/chuyển phương thức sẽ xóa mã.

Phiên UI có method FACE; chức năng đăng ký/thay mặt yêu cầu đăng xuất và
đăng nhập lại bằng mật khẩu. Core phải kiểm tra phương thức xác thực ở server
(claim/session do Core quản lý), không tin method trong frontend.

## Phiên và đăng xuất

AdminAuthProvider chuyển phiên đã xác thực sang `roomix_api_session_v1`.
AuthProvider chung kiểm tra hồ sơ và quyền truy cập; adapter API gửi Bearer
token, xử lý refresh theo hợp đồng backend hiện có. Tải lại trang vẫn có thể
khôi phục phiên API, nhưng thông tin đăng nhập bằng mật khẩu chỉ giữ trong
bộ nhớ và gắn với token đã xác thực: cần đăng nhập mật khẩu lại trước khi
đăng ký mặt sau khi tải lại trang hoặc token đổi.

Đăng xuất xóa phiên chung, thông tin phương thức và gọi adapter logout.
Khả năng refresh/thu hồi phiên phụ thuộc endpoint backend đang triển khai.
Token mock không mở được khu vực Admin.

## Kiểm tra

```powershell
node --experimental-strip-types --test tests/admin-auth.test.mjs tests/face-camera.test.mjs
npx tsc --noEmit
```

HTTP trong unit test được giả lập. Cần chạy Core/Gateway thật để kiểm tra
CORS, tài khoản thử, JWT và phản hồi thực tế trước khi kết luận tích hợp đạt.
Cả đăng ký và đăng nhập mặt đã có frontend và API Core. Đã kiểm tra HTTP thật
giữa Face Python và Core Java trên PostgreSQL riêng với analyzer giả lập:
ENROLL lưu hồ sơ, LOGIN nhận JWT và callback thất bại không cấp JWT.
Sau đó đã kiểm tra qua Gateway và trình duyệt; người dùng xác nhận webcam
ENROLL/LOGIN thành công với backend local và Docker, cùng Telegram theo yêu cầu.
Chưa benchmark độ chính xác/chống giả mạo. Kết quả chi tiết nằm trong backend:
face-auth-service/docs/LOCAL_ACCEPTANCE.md.
