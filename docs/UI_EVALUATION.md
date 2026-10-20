# UI EVALUATION — Roomix (đánh giá sau vòng functional alignment)

Ngày: 2026-10-21 · Nguồn đối chiếu: `docs/FUNCTION_MAP.md` (Use Case docx + backend Roomix_Backend @ 615544b).
Mỗi màn hình được điều chỉnh cho bám đúng chức năng UC/backend, sau đó đánh giá theo 5 tiêu chí của chủ dự án:
1) Hiệu suất & tốc độ nhập liệu · 2) Mật độ & phân cấp dữ liệu · 3) Tùy biến & phân quyền ·
4) Bao dung & giảm rủi ro · 5) Khả năng mở rộng. Thang: Đạt / Một phần / Chưa đạt / Không áp dụng.
Dữ liệu vẫn là mock; state lưu localStorage qua các store theo luồng (seam thay bằng API thật sau này).
Dấu `*` = điểm "Đạt (mock)" do người đánh giá ghi: chức năng chạy trên mock seam vì backend chưa có module/endpoint tương ứng.

## Bảng tổng hợp

| Luồng | Màn hình | 1. Nhập liệu | 2. Mật độ & phân cấp | 3. Tùy biến & phân quyền | 4. Bao dung & phục hồi | 5. Mở rộng |
|---|---|---|---|---|---|---|
| Tenant | `/` — Trang chủ / Tìm kiếm (A1 + A6 FilterModal) | Một phần | Đạt | Một phần | Đạt | Một phần |
| Tenant | `/rooms/[id]` — Chi tiết phòng (A2) | Một phần | Một phần | Đạt | Một phần | Một phần |
| Tenant | `/ai` + AiPanel (A3) | Đạt | Một phần | Một phần | Một phần | Một phần |
| Tenant | `/requests` — Yêu cầu của tôi (A4) | Một phần | Một phần | Đạt | Đạt | Một phần |
| Tenant | `/login` — Đăng nhập (A5) | Đạt | Không áp dụng | Một phần | Một phần | Một phần |
| Tenant | `/register` — Đăng ký (A5) | Đạt | Một phần | Đạt | Một phần | Đạt |
| Tenant | `/states` — Showcase trạng thái (A7) | Không áp dụng | Một phần | Không áp dụng | Một phần | Một phần |
| Tenant | `/favorites` — Phòng yêu thích (A8) | Một phần | Một phần | Đạt | Đạt | Một phần |
| Tenant | A9 — Avatar dropdown (trong TenantHeader) | Không áp dụng | Không áp dụng | Đạt | Một phần | Một phần |
| Tenant | `/notifications` — Thông báo (UC07.7) | Một phần | Đạt | Đạt | Đạt | Một phần |
| Tenant | `/profile` — Hồ sơ cá nhân (UC01.4) | Đạt | Một phần | Đạt | Một phần | Một phần |
| Landlord | Dashboard (B1) — `/landlord` | Không áp dụng | Đạt | Một phần | Đạt | Một phần |
| Landlord | Rooms (B2) — `/landlord/rooms` | Đạt | Đạt | Một phần | Đạt | Một phần |
| Landlord | Listings (B3) — `/landlord/listings` | Đạt | Đạt | Một phần | Đạt | Đạt |
| Landlord | Listings/Create (B4) — `/landlord/listings/create` | Đạt | Đạt | Không áp dụng | Đạt | Một phần |
| Landlord | Requests (B5 + B12) — `/landlord/requests`, `RejectModal` | Đạt | Đạt | Một phần | Đạt | Đạt |
| Landlord | Tenants (B6) — `/landlord/tenants` | Đạt | Đạt | Một phần | Đạt | Một phần |
| Landlord | Invoices (B7 + B13) — `/landlord/invoices`, `InvoiceDrawer` | Đạt | Đạt | Một phần | Đạt | Đạt |
| Landlord | Statistics (B8) — `/landlord/statistics` | Không áp dụng | Đạt | Một phần | Đạt | Một phần |
| Landlord | Notifications (B9) — `/landlord/notifications` | Đạt | Đạt | Một phần | Đạt | Đạt |
| Landlord | Profile (B10) — `/landlord/profile` | Đạt | Đạt | Một phần | Đạt | Một phần |
| Landlord | Login (B11) — `/landlord/login` | Đạt | Đạt | Một phần | Đạt | Một phần |
| Admin | Login — `/admin/login` (C1) | Đạt | Đạt | Không áp dụng | Một phần | Một phần |
| Admin | Dashboard — `/admin` (C2) | Không áp dụng | Đạt | Chưa đạt | Đạt | Một phần |
| Admin | Moderation queue — `/admin/moderation` (C3) | Đạt | Đạt | Một phần | Đạt | Một phần |
| Admin | Moderation detail — `/admin/moderation/[id]` (C7) | Đạt | Đạt | Một phần | Đạt | Một phần |
| Admin | Users — `/admin/users` (C4) | Đạt | Đạt | Một phần | Đạt | Một phần |
| Admin | Reports — `/admin/reports` (C5) — ⚠️ UI-AHEAD-OF-BACKEND | Đạt* | Một phần | Một phần | Đạt* | Chưa đạt |
| Admin | Notifications & Audit log — `/admin/notifications` (C6) | Đạt* | Đạt | Một phần | Một phần | Một phần |

---

# Chi tiết theo luồng

## Luồng Tenant

### EVAL — Tenant flow (đánh giá sau vòng functional alignment)

Ngày: 2026-10-21 · Phạm vi: flow Khách thuê (A1–A9) · Nguồn đối chiếu: `docs/FUNCTION_MAP.md`
(UC + backend @ 615544b), code sau khi sửa. Dữ liệu vẫn là mock; state phía tenant
(favorites, requests tự tạo/hủy, bộ lọc, tùy chọn thông báo) lưu ở localStorage qua
`src/lib/tenant-store.ts` — đây là seam thay bằng API thật sau này.

Thang điểm: **Đạt / Một phần / Chưa đạt / Không áp dụng**, mỗi tiêu chí kèm 1 dòng bằng chứng cụ thể.

---

### 1. `/` — Trang chủ / Tìm kiếm (A1 + A6 FilterModal)

**Chức năng đã khớp:** UC02.1 tìm kiếm (khớp `GET /api/rooms/search?location=`), UC02.2 lọc
giá/diện tích/tiện ích/loại phòng (`minPrice/maxPrice/minArea/amenities`), UC02.3 sắp xếp
(`sort`), Favorite (`POST/DELETE /api/favorites/{roomId}`).

**Điều chỉnh đã làm:**
- FilterModal hết là "vỏ": state draft → `Áp dụng` mới ghi vào danh sách; nút hiển thị
  **số phòng khớp trực tiếp** theo draft + từ khóa + category của trang (bỏ "24 phòng" cứng).
- Category row (Phòng đơn/đôi/Nguyên căn/Gần trường/Ban công/Máy giặt) lọc thật, map lên
  các field phòng hiện có (size/tiện ích/khu vực) vì mock và backend đều không có `room_type`.
- Thêm control sắp xếp: Mới nhất / Giá ↑ / Giá ↓ / Diện tích ↑↓ (UC02.3).
- Phụ đề đổi thành "Hiển thị X / Y phòng" tính live; chips tiêu chí đang áp có thể gỡ từng cái.
- Từ khóa + category + bộ lọc + sort được lưu localStorage và khôi phục khi quay lại.
- Trạng thái rỗng đúng nghĩa: giải thích + nút "Xóa bộ lọc" + lối sang AI.

**Scorecard:**
1. Hiệu suất nhập liệu — **Một phần** — debounce 300ms và khôi phục nguyên trạng thái tìm kiếm lần trước, nhưng chưa có gợi ý từ khóa/lịch sử tìm kiếm.
2. Mật độ & phân cấp dữ liệu — **Đạt** — search + category + filter + sort kết hợp trên cùng một danh sách, đếm "X / Y" live và gỡ từng chip tiêu chí.
3. Tùy biến & phân quyền — **Một phần** — bộ lọc là tùy biến cá nhân được persist theo tenant; phân quyền theo vai trò nằm ở auth, màn này không phân biệt thêm.
4. Bao dung & phục hồi — **Đạt** — kết quả rỗng luôn có đường thoát 1 click ("Xóa bộ lọc") và không mất từ khóa đã gõ.
5. Khả năng mở rộng — **Một phần** — toàn bộ logic lọc nằm ở `tenant-store.applyRoomFilters` dùng chung cho trang + modal, nhưng vẫn chạy trên mock localStorage, chưa nối `/rooms/search`.

**Khoảng trống còn lại:** backend không có `maxArea`/`room_type` nên band diện tích và loại
phòng là map phía client; phân trang chưa có (danh sách mock 6 phòng); đánh giá sao trên card
vẫn là dữ liệu trang trí (backend không có rating).

### 2. `/rooms/[id]` — Chi tiết phòng (A2)

**Chức năng đã khớp:** UC02.4 chi tiết (`GET /api/rooms/{roomId}`), UC02.6 gửi yêu cầu
(`POST /api/rentals` — `SendRentalRequest: roomId + note`), UC02.8 Contact Card chỉ mở sau
ACCEPTED, UC06.5 hỏi AI về một phòng (rag `POST /api/v1/chat`), Favorite.

**Điều chỉnh đã làm:**
- Nút "Gửi yêu cầu quan tâm" hết chết: có ô lời nhắn (note), tạo request PENDING lưu
  localStorage, hiện ngay ở `/requests`; toast kèm nút "Xem yêu cầu".
- Chặn trùng: phòng đã có request PENDING/ACCEPTED của chính tenant thì nút chuyển trạng
  thái "Đã gửi yêu cầu · Đang chờ" và không gửi thêm được (kể cả request seed của tenant).
- Contact Card vẫn khóa khi chưa ACCEPTED; khi ACCEPTED hiển thị SĐT/Zalo/email thật.
- Thêm nút tim yêu thích ngay trên trang chi tiết (trước đây chỉ có trên card).
- "Hỏi AI về phòng này" hết chết: mở AiPanel kèm ngữ cảnh phòng (UC06.5).

**Scorecard:**
1. Hiệu suất nhập liệu — **Một phần** — gửi yêu cầu chỉ cần 1 trường note tùy chọn + 1 click, nhưng chưa prefill ngày dọn vào/số người từ hồ sơ.
2. Mật độ & phân cấp dữ liệu — **Một phần** — bố cục Figma giữ nguyên, song specs "Tối đa 2 người / Đặt cọc 1 tháng" vẫn là chữ cứng vì model Room không có `maxTenants/depositAmount`.
3. Tùy biến & phân quyền — **Đạt** — Contact Card phân quyền theo trạng thái request: khóa khi PENDING, mở đúng khi ACCEPTED (UC02.8).
4. Bao dung & phục hồi — **Một phần** — chặn gửi trùng và trạng thái đã gửi hiển thị bền vững; việc hủy/phục hồi nằm ở `/requests` (có ConfirmDialog + Hoàn tác), trang này chưa hủy tại chỗ được.
5. Khả năng mở rộng — **Một phần** — `createRequest` trong tenant-store là seam 1-1 với `POST /api/rentals`; trang vẫn generate tĩnh từ mock.

**Khoảng trống còn lại:** dòng "Phí dịch vụ 100.000đ" trong bảng chi phí vẫn chưa khớp
`InvoiceItemType` (backend chỉ có ROOM_RENT/ELECTRICITY/WATER) — giữ theo khung Figma đã duyệt,
cần quyết định sản phẩm; UC02.5 mới là stub (tên chủ trọ + số phòng tĩnh, chưa có trang hồ sơ chủ trọ).

### 3. `/ai` + AiPanel (A3)

**Chức năng đã khớp:** UC06.1 chat, UC06.2 trích tiêu chí → chips, UC06.3 trả lời có căn cứ,
UC06.4 đề xuất phòng kèm % khớp, UC06.5 hỏi về một phòng cụ thể, UC06.6 tìm kiếm nhiều tiêu chí.
Backend tương ứng: rag-service `POST /api/v1/chat` **đã tồn tại** (`ChatResponse`: answer,
matched_rooms, source_documents, suggested_follow_ups) — UI hiện vẫn chạy trên mock seam
(`buildReply` trong AiPanel), chưa gọi API thật.

**Điều chỉnh đã làm:**
- Hội thoại thành state thật: quick actions, chips và ô nhập đều đi qua cùng một luồng gửi.
- Reply tính từ dữ liệu phòng mock: trích giá ("dưới 3 triệu"), số người, tiện ích, khu vực
  thành criteria chips; chấm % khớp và xếp hạng phòng thật thay cho bản cứng 98%/92%.
- Phòng gợi ý bấm được → sang `/rooms/[id]` (trước đây bấm không có tác dụng).
- Follow-up chips lấy từ `followUps` của reply gần nhất (mô phỏng `suggested_follow_ups`),
  gồm cả luồng so sánh phòng theo mã và hỏi giá điện/nước.
- Nhận ngữ cảnh phòng từ A2 và trả lời về đúng phòng đó; bỏ nút "+" trang trí chết ở ô nhập.

**Scorecard:**
1. Hiệu suất nhập liệu — **Đạt** — quick action/chip gửi trong 1 click, Enter để gửi, panel tự cuộn theo tin nhắn mới.
2. Mật độ & phân cấp dữ liệu — **Một phần** — mỗi reply có cấu trúc text + phòng khớp + chips tiêu chí, nhưng chưa hiển thị nguồn căn cứ (`source_documents`) như UC06.3 yêu cầu.
3. Tùy biến & phân quyền — **Một phần** — ngữ cảnh phòng (UC06.5) hoạt động; `user_role` của ChatRequest chưa được truyền vì chưa nối API.
4. Bao dung & phục hồi — **Một phần** — không khớp tiêu chí vẫn trả lựa chọn gần nhất kèm giải thích thay vì dead-end; hội thoại mất khi panel remount, chưa có nút làm mới/xóa.
5. Khả năng mở rộng — **Một phần** — cấu trúc message đã khớp hình dạng ChatResponse (answer/matched_rooms/follow_ups) để thay `buildReply` bằng rag-service, còn thiếu field sources.

**Khoảng trống còn lại:** chưa nối rag-service thật (chủ đích giữ mock seam vòng này);
lịch sử hội thoại (`conversation_history`) chưa persist qua các màn.

### 4. `/requests` — Yêu cầu của tôi (A4)

**Chức năng đã khớp:** UC02.6 theo dõi yêu cầu (`GET /api/rentals`), hủy yêu cầu
(`POST /api/rentals/{id}/cancel`, `RequestStatus.CANCELLED`), UC02.8 Contact Card khi ACCEPTED.

**Điều chỉnh đã làm:**
- Thêm **Hủy yêu cầu** cho request PENDING: qua ConfirmDialog (danger), chuyển CANCELLED,
  toast kèm **Hoàn tác** khôi phục lại PENDING; hủy được persist nên chi tiết phòng mở gửi lại.
- **Xóa hẳn** nút dev "Mô phỏng: chủ trọ chấp nhận" — không UC/backend nào hỗ trợ tenant tự
  chấp nhận; request seed ACCEPTED vẫn giữ để demo Contact Card mở khóa.
- Hiển thị lời nhắn của tenant trên từng request; bỏ lý do từ chối bịa cứng cho mọi request
  (REJECTED chỉ nêu trạng thái, vì seed không có `rejectReason` riêng).
- Thêm trạng thái CANCELLED (badge xám) bằng type widening cục bộ trong tenant-store;
  có empty state khi chưa có yêu cầu nào.

**Scorecard:**
1. Hiệu suất nhập liệu — **Một phần** — màn không có form; thao tác hủy gói trong 2 bước (nút → xác nhận) để tránh hủy nhầm.
2. Mật độ & phân cấp dữ liệu — **Một phần** — đủ 4 trạng thái + note + thông tin phòng/Contact Card trên một danh sách, nhưng chưa có lọc theo trạng thái hay tìm kiếm.
3. Tùy biến & phân quyền — **Đạt** — quyền thao tác theo trạng thái: chỉ PENDING mới hủy được, Contact Card chỉ lộ khi ACCEPTED.
4. Bao dung & phục hồi — **Đạt** — hủy bắt buộc qua ConfirmDialog nêu hậu quả và luôn hoàn tác được bằng toast trong 6 giây.
5. Khả năng mở rộng — **Một phần** — merged store (seed + tự tạo + cancelled) là seam cho `GET /api/rentals`; `CANCELLED` còn là widening cục bộ vì `src/types` chưa cập nhật.

**Khoảng trống còn lại:** chưa có bộ lọc trạng thái; request của các tenant khác trong seed
vẫn hiển thị chung (đặc thù dữ liệu mock dùng chung hai phía tenant/landlord).

### 5. `/login` — Đăng nhập (A5)

**Chức năng đã khớp:** UC01.2 đăng nhập (`POST /api/auth/login`), UC01.5 định tuyến theo vai trò.

**Điều chỉnh đã làm:**
- Validation inline theo thời gian thực (khi gõ sau lần chạm đầu + khi blur + khi submit):
  tài khoản phải là email đúng định dạng hoặc SĐT 10 số bắt đầu bằng 0; mật khẩu bắt buộc, tối thiểu 8 ký tự.
- Trường bắt buộc đánh dấu `*`, có `aria-required/aria-invalid` và thông báo lỗi cụ thể dưới từng trường.
- Enter submit qua form thật; autocomplete giữ `username` / `current-password`; lỗi không làm mất dữ liệu đã nhập.

**Scorecard:**
1. Hiệu suất nhập liệu — **Đạt** — autocomplete đúng chuẩn trình duyệt, Enter gửi form, lỗi hiện ngay khi gõ/blur không cần submit thử.
2. Mật độ & phân cấp dữ liệu — **Không áp dụng** — màn form thuần, không hiển thị dữ liệu danh sách.
3. Tùy biến & phân quyền — **Một phần** — đăng nhập thành công vẫn luôn về trang tenant; route theo role (landlord có L11 riêng) chưa suy ra từ tài khoản ở bản mock.
4. Bao dung & phục hồi — **Một phần** — sai định dạng có thông báo cụ thể và giữ nguyên nội dung đã nhập; chưa có đường khôi phục mật khẩu (backend cũng chưa có endpoint).
5. Khả năng mở rộng — **Một phần** — validators tách hàm riêng để thay bằng lỗi API (sai mật khẩu, tài khoản LOCKED) khi nối `POST /api/auth/login`.

**Khoảng trống còn lại:** "Quên mật khẩu?" và "Tiếp tục với Google" vẫn là control chết —
cả hai đều không có trong UC/backend (không OAuth, không forgot-password endpoint), giữ nguyên
khung Figma và ghi nhận tại đây thay vì giả lập.

### 6. `/register` — Đăng ký (A5)

**Chức năng đã khớp:** UC01.1 đăng ký kèm chọn vai trò (`POST /api/auth/register`,
`RegisterRequest`: username, fullName, email, password, phoneNumber, role), UC01.5.

**Điều chỉnh đã làm:**
- Form cũ **không thể** thỏa DTO backend (gộp "Email hoặc số điện thoại" một trường, thiếu
  username và phone). Nay đủ 5 trường riêng: Họ tên, Tên đăng nhập, Email, Số điện thoại,
  Mật khẩu — mỗi trường một validator khớp đúng rule backend (username
  `^[a-zA-Z0-9._-]{4,50}$`, password 8–72 ký tự, phone 10 số).
- Đánh dấu `*` cho mọi trường bắt buộc + ghi chú "* là bắt buộc"; validation inline khi gõ/blur.
- Autocomplete đầy đủ: `name / username / email / tel / new-password`; thêm nút hiện/ẩn mật khẩu như login.
- Chọn vai trò xong điều hướng đúng login của vai trò đó (Chủ trọ → `/landlord/login`).

**Scorecard:**
1. Hiệu suất nhập liệu — **Đạt** — autocomplete theo từng loại trường giúp trình duyệt điền đúng ô, lỗi sửa đến đâu hết đến đó.
2. Mật độ & phân cấp dữ liệu — **Một phần** — 5 trường + chọn vai trò vừa một cột không cuộn dài, đánh dấu bắt buộc rõ ràng.
3. Tùy biến & phân quyền — **Đạt** — toggle Khách thuê/Chủ trọ map thẳng `RegisterRequest.role` và route sau đăng ký đi theo vai trò đã chọn.
4. Bao dung & phục hồi — **Một phần** — lỗi định dạng xử lý tại chỗ và giữ dữ liệu; lỗi trùng email/username (exception của UC01.1) chưa kiểm tra được vì cần API.
5. Khả năng mở rộng — **Đạt** — validators khai báo 1-1 theo field của RegisterRequest, nối API chỉ cần map lỗi server vào cùng cấu trúc errors.

**Khoảng trống còn lại:** chưa kiểm tra trùng email/username; nút Google vẫn chết/không được
hỗ trợ (như login); chưa có ô nhập lại mật khẩu để chống gõ sai.

### 7. `/states` — Showcase trạng thái (A7)

**Chức năng đã khớp:** không thuộc UC nào — đây là trang trưng bày empty state + skeleton
của design system, không phải màn sản phẩm.

**Điều chỉnh đã làm:** không sửa trang này; thay vào đó các pattern của nó đã được dùng thật:
empty state favorites (cùng minh họa/quay lại khám phá) nay xuất hiện ở `/favorites` khi danh
sách rỗng, và `/` + `/requests` có empty state riêng theo cùng ngôn ngữ thị giác.

**Scorecard:**
1. Hiệu suất nhập liệu — **Không áp dụng** — trang trưng bày, không có nhập liệu.
2. Mật độ & phân cấp dữ liệu — **Một phần** — skeleton grid có sẵn nhưng chưa màn thật nào dùng vì dữ liệu mock nạp đồng bộ, không có trạng thái loading thật.
3. Tùy biến & phân quyền — **Không áp dụng** — không gắn vai trò người dùng.
4. Bao dung & phục hồi — **Một phần** — pattern empty state đã được tái dùng ở màn thật kèm hành động khôi phục (xóa lọc / khám phá phòng).
5. Khả năng mở rộng — **Một phần** — giữ làm tài liệu tham chiếu pattern; khi nối API thật cần gắn skeleton vào lúc fetch của `/` và `/favorites`.

**Khoảng trống còn lại:** chưa có loading state thật ở bất kỳ màn tenant nào (hệ quả của mock đồng bộ).

### 8. `/favorites` — Phòng yêu thích (A8)

**Chức năng đã khớp:** danh sách yêu thích của backend Favorite (`GET /api/favorites`,
`DELETE /api/favorites/{roomId}`), phục vụ luồng UC02.1/UC02.6.

**Điều chỉnh đã làm:**
- Trang hết là server component tĩnh: tim trên mọi card (trang chủ, chi tiết, favorites)
  ghi qua cùng một store localStorage — bấm ở đâu, trang này cập nhật ở đó.
- Gỡ yêu thích tại trang này có toast **Hoàn tác** khôi phục lại đúng phòng.
- Số lượng "X phòng đã lưu" tính live; hết phòng thì hiện empty state (trước đây empty
  state chỉ tồn tại ở trang showcase `/states`).
- Lần đầu vào trang vẫn seed từ `favoriteRooms` cũ để demo không đổi.

**Scorecard:**
1. Hiệu suất nhập liệu — **Một phần** — toggle 1 click và đồng bộ tức thì giữa các màn, nhưng chưa có tìm kiếm/sắp xếp ngay trong danh sách yêu thích.
2. Mật độ & phân cấp dữ liệu — **Một phần** — grid card nhất quán với trang chủ và đếm live; chưa có sort theo giá/ngày lưu.
3. Tùy biến & phân quyền — **Đạt** — danh sách là dữ liệu cá nhân của tenant, persist bền qua các phiên (localStorage).
4. Bao dung & phục hồi — **Đạt** — gỡ nhầm khôi phục được bằng Hoàn tác trên toast, empty state có lối quay lại khám phá phòng.
5. Khả năng mở rộng — **Một phần** — store dùng chung một hàm toggle cho mọi bề mặt, sẵn sàng thay bằng Favorite API; ID phòng vẫn là number như mock (backend dùng UUID).

**Khoảng trống còn lại:** chưa sort/filter trong favorites; đồng bộ đa thiết bị chưa có (chỉ localStorage).

### 9. A9 — Avatar dropdown (trong TenantHeader)

**Chức năng đã khớp:** UC01.3 đăng xuất (link về `/login` — backend không có endpoint logout,
hủy phiên phía client là cách duy nhất), UC01.4 điểm vào hồ sơ, tùy chọn thông báo.

**Điều chỉnh đã làm:**
- Hàng "Thông báo · Bật" từ div chết thành **switch thật** (`role="switch"`, `aria-checked`):
  bấm để bật/tắt, trạng thái lưu localStorage và giữ nguyên qua các màn/phiên.
- Header nhận sự kiện mở AI từ trang chi tiết phòng, nên nút "Hỏi AI về phòng này" (A2) hoạt động.
- Các link Yêu cầu của tôi / Phòng yêu thích giữ nguyên và đóng menu khi điều hướng.

**Scorecard:**
1. Hiệu suất nhập liệu — **Không áp dụng** — dropdown không có form; toggle là thao tác 1 click.
2. Mật độ & phân cấp dữ liệu — **Không áp dụng** — menu điều hướng, không hiển thị dữ liệu nghiệp vụ.
3. Tùy biến & phân quyền — **Đạt** — tùy chọn thông báo là cá nhân hóa theo tenant và được persist thật, không còn là nhãn trang trí.
4. Bao dung & phục hồi — **Một phần** — đổi ý được ngay bằng cách bấm lại switch (hành động nhẹ nên không cần confirm/undo riêng).
5. Khả năng mở rộng — **Một phần** — preference lưu qua tenant-store, thay được bằng cài đặt tài khoản khi có API; hiện backend chưa có endpoint lưu preference.

**Khoảng trống còn lại (quan trọng, ghi nhận — không tự invent route):**
- Tenant **không có màn hình thông báo**: đầu nhận của UC07.7 chưa được phục vụ dù mock
  `notificationsTenant` và Notification API (list / unread-count / mark-read) đều đã có.
  Toggle ở A9 hiện chỉ lưu preference, chưa có nơi hiển thị thông báo, cũng chưa có badge chưa đọc.
- Tenant **không có màn hình hồ sơ cá nhân**: UC01.4 (xem + cập nhật thông tin) chưa có UI —
  dropdown mới hiển thị định danh read-only; backend cũng chỉ có `GET /api/users/me`, chưa có endpoint cập nhật.
- → Cả hai khoảng trống trên **đã được bổ sung** ở mục 10 (`/notifications`) và mục 11
  (`/profile`) ngay dưới đây; dropdown cũng có thêm hàng "Hồ sơ của tôi" và header có chuông
  kèm badge chưa đọc.


### 10. `/notifications` — Thông báo (đầu nhận UC07.7)

**Chức năng đã khớp:** đầu nhận thông báo của tenant theo UC07.7, khớp module Notification
của backend (`GET /api/notifications`, `GET /api/notifications/unread-count`,
`PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`) với đủ 5 giá trị
`NotificationType` (SYSTEM / INVOICE / POST_APPROVAL / INTEREST_REQUEST / GENERAL).

**Điều chỉnh đã làm (màn hình mới):**
- Danh sách lấy từ tenant store, seed theo đúng mạch dữ liệu của app (yêu cầu Phòng 302 được
  chấp nhận → Contact Card mở khóa, yêu cầu Phòng 405 đang chờ, hóa đơn tháng 10 của Phòng 302,
  bài đăng phòng yêu thích được duyệt, thông báo hệ thống) — chấm màu theo loại dùng chung
  mapping với B9 của chủ trọ.
- Phụ đề đếm chưa đọc live; bấm vào một dòng để đánh dấu đã đọc (persist localStorage);
  "Đánh dấu tất cả đã đọc" có toast **Hoàn tác** khôi phục nguyên trạng thái trước.
- Chip lọc theo loại kèm số lượng từng loại, dòng "Hiển thị X / Y", empty state riêng khi bộ
  lọc không khớp kèm nút xóa lọc.
- Header có nút chuông với badge số chưa đọc lấy từ cùng store (đồng bộ hai chiều với trang
  này qua event + storage); khi công tắc thông báo đang tắt, trang hiện banner nhắc và dẫn
  sang `/profile` để bật lại.

**Scorecard:**
1. Hiệu suất nhập liệu — **Một phần** — không có form; mọi thao tác là 1 click (đọc, đọc tất cả, lọc) và chip là button focus được bằng bàn phím, nhưng chưa có tìm kiếm trong danh sách thông báo.
2. Mật độ & phân cấp dữ liệu — **Đạt** — số chưa đọc nổi bật ở phụ đề và badge chuông, dòng chưa đọc có nền tint + chấm, chip lọc kèm counts và dòng "Hiển thị X / Y" luôn hiện.
3. Tùy biến & phân quyền — **Đạt** — màn hình chỉ dành cho tenant (đầu nhận), trạng thái đã đọc và bộ lọc là dữ liệu cá nhân persist bền; không lộ thao tác của vai trò khác.
4. Bao dung & phục hồi — **Đạt** — "đọc tất cả" hoàn tác được bằng toast; đánh dấu đã đọc từng dòng là thao tác nhẹ, không có hành động phá hủy nào trên màn này.
5. Khả năng mở rộng — **Một phần** — store là seam 1-1 với các endpoint Notification (list / unread-count / read / read-all), nhưng push realtime qua WebSocket gateway (`/api/ws/**`) chưa được nối — hiện vẫn là mock.

**Khoảng trống còn lại:** chưa có push realtime; thời gian hiển thị là chuỗi tương đối trong seed (chưa có timestamp thật); backend không có xóa từng thông báo nên UI không tự invent.

### 11. `/profile` — Hồ sơ cá nhân (UC01.4)

**Chức năng đã khớp:** UC01.4 — xem và cập nhật thông tin cá nhân, trạng thái xác minh, tùy
chọn thông báo. Backend hiện có `GET /api/users/me`; cập nhật hồ sơ / đổi mật khẩu / lưu
preference chưa có endpoint nên chạy trên mock seam của tenant store (đã ghi rõ trong code).

**Điều chỉnh đã làm (màn hình mới):**
- Thẻ định danh: avatar initials (suy ra từ tên đã lưu), tên/email/SĐT, hai hàng xác minh
  Email/SĐT với dấu ✓, chip vai trò Khách thuê; thẻ liên kết nhanh sang Yêu cầu / Yêu thích /
  Thông báo. Điểm vào: hàng "Hồ sơ của tôi" trong dropdown avatar (A9) và bấm thẳng vào khối
  định danh của dropdown; tên + initials trên header cập nhật theo hồ sơ đã lưu.
- Form thông tin: Họ tên* và SĐT* có **validate inline** (báo lỗi khi blur và khi gõ sau
  touched, thông báo cụ thể — SĐT phải đủ 10 số bắt đầu bằng 0), email read-only kèm giải
  thích, địa chỉ liên hệ tùy chọn; Lưu ghi vào store + toast thành công, Hủy khôi phục giá trị
  đã lưu, nút Lưu chỉ bật khi có thay đổi.
- Thẻ đổi mật khẩu: 3 trường có nút hiện/ẩn, validate inline (tối thiểu 8 ký tự, khác mật
  khẩu hiện tại, nhập lại phải khớp), gửi xong xóa form + toast — kèm comment trong code ghi
  rõ đây là mock seam, khi nối API thật sẽ gọi endpoint đổi mật khẩu của auth service.
- Thẻ tùy chọn thông báo: công tắc chung **dùng chung khóa + event với switch ở A9** (đổi ở
  một nơi, nơi còn lại cập nhật ngay) và 3 switch kênh Email / Trong ứng dụng / Thông báo đẩy,
  tất cả persist trong store; tắt công tắc chung thì các switch kênh bị vô hiệu hóa.

**Scorecard:**
1. Hiệu suất nhập liệu — **Đạt** — validate inline lúc gõ/blur với thông báo cụ thể, dấu * cho trường bắt buộc, autocomplete đúng chuẩn (name / tel / street-address / current-password / new-password), nút Lưu chỉ bật khi form dirty.
2. Mật độ & phân cấp dữ liệu — **Một phần** — màn cá nhân vốn ít dữ liệu; định danh + trạng thái xác minh thấy ngay ở thẻ đầu, các form chia thẻ rõ ràng, nhưng không có bảng/danh sách để đánh giá mật độ cao hơn.
3. Tùy biến & phân quyền — **Đạt** — đây chính là bề mặt cá nhân hóa của tenant: sửa định danh + 4 switch thông báo persist thật và nhất quán giữa A9 và trang này; chỉ thao tác trong quyền tenant, và **không invent xóa tài khoản** (backend không có).
4. Bao dung & phục hồi — **Một phần** — Hủy khôi phục được thay đổi chưa lưu và form mật khẩu tự xóa sau khi đổi, nhưng lưu hồ sơ chưa có Hoàn tác/lịch sử phiên bản (backend cũng chưa có endpoint cập nhật hay history).
5. Khả năng mở rộng — **Một phần** — hồ sơ + preference nằm sau tenant-store seam, sẵn sàng thay bằng `GET/PATCH /api/users/me` khi backend bổ sung; mô hình preference (công tắc chung + theo kênh) ánh xạ thẳng sang một settings object.

**Khoảng trống còn lại:** backend chưa có endpoint cập nhật hồ sơ và đổi mật khẩu (UI đang chạy mock seam); địa chỉ liên hệ chưa có trong bản ghi user gốc; chưa có lịch sử thay đổi hồ sơ.

## Luồng Landlord

### Eval — Landlord flow (B1–B13)

Đối chiếu theo `docs/FUNCTION_MAP.md` (UC + backend @615544b), triển khai trên mock data qua
`src/lib/landlord-store.ts` (localStorage, prefix `roomix:landlord:`). Không sửa shared files
(`data.ts`, `types/*`, `ui/*`). Kiểm chứng: `npx tsc --noEmit` — pass, 0 lỗi.

Thang điểm mỗi tiêu chí: Đạt / Một phần / Chưa đạt / Không áp dụng + 1 dòng bằng chứng.

---

### Dashboard (B1) — `/landlord`
**Aligned:** UC03.6 (tổng/đang thuê/trống/lấp đầy 82%), UC05.10 (doanh thu tháng), UC02.7/UC05.9 qua mục Cần xử lý.
**Adjustments:** 4 mục "Cần xử lý" từ text chết thành `Link` tới đúng hàng chờ (requests / invoices-quá-hạn / listings-nháp / invoices-ghi-chỉ-số); số đếm yêu cầu chờ, hóa đơn quá hạn (derived từ dueDate), bài nháp được tính từ landlord-store thay vì hằng số cứng.
- 1) Hiệu suất nhập liệu: Không áp dụng — màn tổng quan không nhập liệu.
- 2) Mật độ & phân cấp: Đạt — 4 KPI + 3 chart + Cần xử lý + Hoạt động, đúng cấu trúc Figma, số đếm Cần xử lý khớp store.
- 3) Tùy biến & phân quyền: Một phần — chỉ có góc nhìn LANDLORD, chưa lọc theo nhà (backend không có stats endpoint).
- 4) Bao dung & phục hồi: Đạt — không thao tác phá hủy; điều hướng an toàn tới các queue.
- 5) Khả năng mở rộng: Một phần — số liệu KPI/chart vẫn là hằng số mock; khi nối API cần endpoint tổng hợp (backend chưa có).
**Remaining gaps:** KPI doanh thu/lấp đầy chưa derived hoàn toàn từ rooms/invoices; hoạt động gần đây vẫn là list tĩnh (backend không có nguồn activity cho landlord).

### Rooms (B2) — `/landlord/rooms`
**Aligned:** UC03.1/03.2 (nhà/tầng — hiển thị, chưa có endpoint), UC03.3/03.4 (phòng + trạng thái RoomStatus), UC03.6 (đếm trống theo tầng).
**Adjustments:** Thay vòng lặp trạng thái mù bằng picker 3 trạng thái còn lại → `ConfirmDialog` nêu hậu quả cụ thể từng trạng thái + toast Hoàn tác; trạng thái persist vào store (shared với Tenants/Invoices); tab tầng hiển thị `trống/tổng`; thêm ô tìm theo mã phòng + "Hiển thị X phòng"; floor groups giữ counts.
- 1) Hiệu suất nhập liệu: Đạt — tìm theo mã lọc tức thì, đổi trạng thái 2 click + xác nhận.
- 2) Mật độ & phân cấp: Đạt — grid phòng + panel chi tiết 324px giữ nguyên, counts nằm ngay trên tab tầng.
- 3) Tùy biến & phân quyền: Một phần — chỉ 1 nhà Lê Văn Lương quản lý được; backend không có House/Floor controller.
- 4) Bao dung & phục hồi: Đạt — mọi đổi trạng thái đều qua ConfirmDialog + Hoàn tác qua toast (6s).
- 5) Khả năng mở rộng: Một phần — override theo roomId trong store thay được bằng PUT khi có API; chưa có tạo/sửa/xóa phòng.
**Remaining gaps:** Không có thêm nhà/tầng/phòng/sửa thông tin phòng (UC03.1/03.2/03.3-add/03.5) vì backend chỉ có entity, không có endpoint; không có link tenancy cho phòng OCCUPIED.

### Listings (B3) — `/landlord/listings`
**Aligned:** UC04.2 (xem bài của mình), UC04.3 (sửa — PUT), UC04.4 (xóa — backend chưa có DELETE, ghi rõ), UC04.5 (ẩn/hiện — hide/unhide), UC04.6 (gửi duyệt — submit DRAFT→PENDING).
**Adjustments:** Hàng bài đăng có đủ thao tác Sửa (modal prefilled + validation) / Gửi duyệt / Gửi lại / Ẩn / Hiện / Xóa (ConfirmDialog + Hoàn tác); REJECTED hiển thị `rejectReason`; chips lọc có counts, thêm search + dòng "Hiển thị X / Y".
- 1) Hiệu suất nhập liệu: Đạt — sửa tại chỗ trong modal, không rời danh sách; validation tiêu đề/giá tức thì.
- 2) Mật độ & phân cấp: Đạt — bảng 5 cột (thêm Thao tác), lý do từ chối nằm ngay dưới hàng liên quan.
- 3) Tùy biến & phân quyền: Một phần — chỉ bài của landlord hiện tại; views vẫn là số trang trí (backend không tracking).
- 4) Bao dung & phục hồi: Đạt — xóa/ẩn/gửi đều có Hoàn tác; xóa qua ConfirmDialog danger.
- 5) Khả năng mở rộng: Đạt — store theo PostStatus chuẩn backend, map thẳng sang submit/hide/unhide khi nối API.
**Remaining gaps:** Xóa chỉ là cục bộ (backend thiếu DELETE); chưa xem trước bài như khách thấy từ danh sách.

### Listings/Create (B4) — `/landlord/listings/create`
**Aligned:** UC04.1 (tạo bài — POST multipart `LandlordRoomRequest`), UC04.6 (gửi duyệt), rag `/pricing/predict` (gợi ý giá).
**Adjustments:** Autosave DRAFT vào localStorage + badge "✓ Đã lưu tạm lúc HH:MM" + khôi phục khi quay lại (kèm toast); thêm nút Lưu nháp (tạo Post DRAFT vào B3) và Gửi duyệt (tạo Post PENDING vào B3); bổ sung các trường backend bắt buộc còn thiếu: nhà (houseId) + tầng (floorId) selects, tiền cọc, ngày vào ở, số người tối đa; dấu * + validation inline; giữ AI giá + AI mô tả.
- 1) Hiệu suất nhập liệu: Đạt — chọn phòng tự điền giá/cọc/tiện ích, AI điền mô tả/giá 1 click, autosave chống mất dữ liệu.
- 2) Mật độ & phân cấp: Đạt — form trái + cột AI/preview phải giữ nguyên Figma, badge lưu tạm không chiếm diện tích form.
- 3) Tùy biến & phân quyền: Không áp dụng — form tạo mới không có phân quyền theo vai trò ngoài LANDLORD.
- 4) Bao dung & phục hồi: Đạt — rời trang không mất nháp (restore + thông báo), lỗi validation chỉ rõ từng trường.
- 5) Khả năng mở rộng: Một phần — payload đã đủ field cho `LandlordRoomRequest` trừ upload ảnh thật (vẫn mock, có toast giải thích).
**Remaining gaps:** Upload ảnh chưa nối multipart; wizard 3 bước vẫn là chip hiển thị; gợi ý giá AI vẫn là số mock theo shape pricing API.

### Requests (B5 + B12) — `/landlord/requests`, `RejectModal`
**Aligned:** UC02.7 (accept/reject kèm lý do — `POST /rentals/{id}/accept` với `AcceptRentalRequest`, `/reject` với `ReasonRequest`), UC02.8 (Contact Card gửi khi ACCEPTED), UC05.3 (accept tạo Tenancy).
**Adjustments:** Accept mở modal điều khoản bắt buộc (tiền thuê*, cọc*, ngày bắt đầu*, chu kỳ*, đơn giá điện*/nước*, hạn cọc) + validation inline → tạo tenancy PENDING (chờ cọc) hiện ở B6, phòng chuyển RESERVED; Reject qua RejectModal với lý do BẮT BUỘC ("Lý do khác" bắt buộc nhập chi tiết), lý do được lưu vào `rejectReason` và hiển thị lại; badge số chờ xử lý trên tab "Yêu cầu" ở HostTopbar; accept/reject đều có toast Hoàn tác.
- 1) Hiệu suất nhập liệu: Đạt — modal accept prefill giá phòng/đơn giá chuẩn, chỉ sửa khi khác mặc định.
- 2) Mật độ & phân cấp: Đạt — list + detail giữ nguyên, điều khoản tách vào modal không làm phình panel.
- 3) Tùy biến & phân quyền: Một phần — đúng vai LANDLORD xử lý; chưa có trạng thái CANCELLED (type drift đã ghi ở FUNCTION_MAP, ngoài scope sửa types).
- 4) Bao dung & phục hồi: Đạt — Hoàn tác khôi phục cả request + tenancy vừa tạo; từ chối không thể gửi khi thiếu lý do.
- 5) Khả năng mở rộng: Đạt — form khớp 1-1 các field của `AcceptRentalRequest`, nối API không đổi UI.
**Remaining gaps:** Contact Card gửi đi không có bản ghi nội dung đã gửi cho landlord; tenancy tạo ra ở trạng thái chờ cọc cần luồng xác nhận cọc ở B6 (đã có).

### Tenants (B6) — `/landlord/tenants`
**Aligned:** UC05.1 (quản lý khách), UC05.2 (phân phòng), UC05.3 (hợp đồng), UC05.4 (trả phòng/tất toán — settlement preview + complete), `confirm-deposit`.
**Adjustments:** Danh sách + hợp đồng đọc từ store (thấy tenancy mới từ B5, gồm trạng thái PENDING chờ cọc); "Phân phòng" mở picker chỉ gồm phòng AVAILABLE → ConfirmDialog → phòng thành OCCUPIED + Hoàn tác; "Trả phòng / Tất toán" mở preview mock (điện/nước cuối kỳ, khấu trừ, hoàn cọc = cọc − khấu trừ) → confirm danger → tenancy ENDED + phòng về AVAILABLE + Hoàn tác; nút "Xác nhận đã nhận cọc" cho tenancy PENDING (→ ACTIVE); giá điện/nước/chu kỳ lấy từ tenancy thay vì chuỗi cứng.
- 1) Hiệu suất nhập liệu: Đạt — phân phòng chọn trực tiếp trên grid phòng trống, không nhập tay mã phòng.
- 2) Mật độ & phân cấp: Đạt — giữ layout list + panel hợp đồng 6 trường, preview tất toán trong modal riêng.
- 3) Tùy biến & phân quyền: Một phần — backend không có endpoint gán phòng độc lập (đã chú thích trên UI); phân phòng ở đây là cho khách đã có hợp đồng.
- 4) Bao dung & phục hồi: Đạt — cả 3 thao tác hệ quả (phân phòng, tất toán, nhận cọc) đều qua confirm + Hoàn tác.
- 5) Khả năng mở rộng: Một phần — settlement dùng chỉ số cuối mock; khi nối API thay bằng `settlement/preview` thật.
**Remaining gaps:** Chưa sửa hợp đồng (UC05.3-update), chưa thêm khách ngoài luồng accept, chưa xem văn bản điều khoản `termsAndConditions`.

### Invoices (B7 + B13) — `/landlord/invoices`, `InvoiceDrawer`
**Aligned:** UC05.5 (ghi điện), UC05.6 (ghi nước), UC05.7 (tổng tháng), UC05.8 (tạo hóa đơn — readings nằm trong `CreateInvoiceRequest`), UC05.9 (confirm/pay), `InvoiceReminder` (POST remind).
**Adjustments:** Form ghi chỉ số cho CẢ điện và nước: chỉ số cũ prefill, tiêu thụ + thành tiền tính LIVE khi gõ, chặn chỉ số mới < cũ; "Tạo hóa đơn" tạo thật invoice PENDING (rent + điện + nước + phí dịch vụ) xuất hiện trong list + mở drawer; confirm/pay qua ConfirmDialog chuyển PENDING→CONFIRMED→PAID + ghi history; "Gửi nhắc" ghi reminder (hiển thị số lần + lịch sử trong drawer); OVERDUE không còn là status lưu trữ — derived từ dueDate (`isOverdue`), quá hạn được gắn nhãn đỏ và sort lên đầu; drawer hiện mã/kỳ/hạn/còn phải thu + breakdown + history + reminders.
**Backend gap (flag):** `InvoiceItemType` chỉ có `ROOM_RENT / ELECTRICITY / WATER` — dòng "Phí dịch vụ" theo công thức UC05.7 chưa có charge type ở backend; UI giữ dòng này và ghi chú rõ trong form, drawer và eval này. Cần quyết định sản phẩm/backend (thêm item type hoặc bỏ dòng phí).
- 1) Hiệu suất nhập liệu: Đạt — 1 form cho cả điện+nước, tổng tiền cập nhật theo từng phím, tạo hóa đơn 1 click khi hợp lệ.
- 2) Mật độ & phân cấp: Đạt — quá hạn sort đầu + badge đỏ; drawer gom breakdown/history/actions một nơi.
- 3) Tùy biến & phân quyền: Một phần — chưa có dispute/resolve-dispute và corrections của backend trên UI.
- 4) Bao dung & phục hồi: Đạt — validation chặn chỉ số lùi, confirm/pay/nhắc/tạo đều có Hoàn tác qua toast.
- 5) Khả năng mở rộng: Đạt — readings + totals khớp shape `CreateInvoiceRequest`/`InvoiceDetailResponse` (kèm derived overdue).
**Remaining gaps:** Chưa dispute/corrections; tiền dịch vụ chờ backend bổ sung item type; chọn kỳ hạn thanh toán khi tạo còn cố định 05/12.

### Statistics (B8) — `/landlord/statistics`
**Aligned:** UC05.10 (thống kê tài chính theo thời gian).
**Adjustments:** Thêm selector kỳ (Tháng 10 / Tháng 9 / Quý 4 / Năm) + selector nhà; KPI doanh thu/đã thu/chưa thu/quá hạn chuyển từ hằng số sang derived từ danh sách hóa đơn trong store (quá hạn derived từ dueDate), kỳ chọn làm thay đổi số liệu hiển thị; ghi chú nguồn số liệu trên UI.
- 1) Hiệu suất nhập liệu: Không áp dụng — chỉ có bộ lọc kỳ/nhà, thao tác 1 chọn.
- 2) Mật độ & phân cấp: Đạt — 4 KPI + 2 chart + AI nhận xét + 2 chart dưới giữ nguyên, selector nằm ở header.
- 3) Tùy biến & phân quyền: Một phần — lọc theo nhà mới ở mức hiển thị, số liệu chưa tách thật theo nhà (không có dữ liệu nhà trên invoice mock).
- 4) Bao dung & phục hồi: Đạt — không thao tác phá hủy; đổi kỳ/nhà khôi phục tức thì.
- 5) Khả năng mở rộng: Một phần — backend không có stats endpoint; khi nối cần aggregate từ invoices (UI đã theo hướng đó).
**Remaining gaps:** Chart tháng/nhà và donut chi phí vẫn là dữ liệu minh họa (donut chi phí không có cơ sở backend — đã chú thích); hệ số theo kỳ là mock scaling.

### Notifications (B9) — `/landlord/notifications`
**Aligned:** Nhận thông báo hệ thống (INTEREST_REQUEST / POST_APPROVAL / INVOICE / SYSTEM / GENERAL), `GET /notifications`, `PATCH /{id}/read`, `PATCH /read-all`, `unread-count`.
**Adjustments:** Click vào thông báo đánh dấu đã đọc (unread có nền + badge "Mới"); nút "Đánh dấu tất cả đã đọc" + Hoàn tác; header hiện số chưa đọc chính xác từ store; badge chuông ở HostTopbar hiện số chưa đọc; chips lọc theo type + "Chưa đọc"; compose giữ nguyên nhưng ghi rõ backend chưa có POST.
- 1) Hiệu suất nhập liệu: Đạt — đánh dấu đọc 1 click ngay trên hàng, mark-all 1 click.
- 2) Mật độ & phân cấp: Đạt — chưa đọc nổi bật bằng nền + badge, đã đọc trở về trọng lượng thường.
- 3) Tùy biến & phân quyền: Một phần — lọc theo type có, chưa lọc theo nhà/phòng.
- 4) Bao dung & phục hồi: Đạt — mark-all có Hoàn tác; mark-read không phá hủy nội dung.
- 5) Khả năng mở rộng: Đạt — state `read` + type khớp Notification API, nối PATCH trực tiếp được.
**Remaining gaps:** Gửi thông báo cho khách vẫn UI-ahead (backend không có POST /notifications, compose không chọn được người nhận cụ thể).

### Profile (B10) — `/landlord/profile`
**Aligned:** UC01.4 (xem + cập nhật hồ sơ), UC02.8 (Contact Card preview).
**Adjustments:** Nút "Chỉnh sửa" mở form thật (họ tên*/điện thoại*/email*) với validation inline (định dạng email, SĐT 9–13 số), lưu mock vào store + toast Hoàn tác, Contact Card preview cập nhật theo hồ sơ vừa lưu.
**Backend gap (flag):** Backend chỉ có `GET /api/users/me` — **không có endpoint cập nhật hồ sơ (PUT/PATCH)**. UC01.4 nửa cập nhật là UI-ahead ở cả hai phía; UI đã ghi chú điều này ngay trong form.
- 1) Hiệu suất nhập liệu: Đạt — sửa tại chỗ trong card, autocomplete name/tel/email, lỗi chỉ rõ trường.
- 2) Mật độ & phân cấp: Đạt — giữ layout hồ sơ + xác minh + Contact Card, form thay thế block đọc khi sửa.
- 3) Tùy biến & phân quyền: Một phần — chưa đổi được vai trò/nhà quản lý (đúng, ngoài quyền landlord).
- 4) Bao dung & phục hồi: Đạt — Hủy bỏ không đổi dữ liệu, Lưu có Hoàn tác.
- 5) Khả năng mở rộng: Một phần — chờ backend bổ sung endpoint update thì nối thẳng, hiện persist local.
**Remaining gaps:** Trạng thái xác minh vẫn là tuyên bố tĩnh; số nhà/phòng quản lý còn cứng ("3 nhà · 36 phòng").

### Login (B11) — `/landlord/login`
**Aligned:** UC01.2 (đăng nhập theo vai trò — `POST /api/auth/login`), UC01.5 (vào đúng flow landlord).
**Adjustments:** Form có state + validation inline (bắt buộc nhập định danh, định dạng email khi có @, mật khẩu ≥ 8 ký tự) trước khi điều hướng; giữ autocomplete `username`/`current-password` + hiện/ẩn mật khẩu; link "Đăng ký chủ trọ" hết chết — trỏ về `/register`.
- 1) Hiệu suất nhập liệu: Đạt — autocomplete chuẩn trình duyệt, lỗi hiện ngay dưới trường, không submit khi invalid.
- 2) Mật độ & phân cấp: Đạt — split-screen photo + form giữ nguyên thiết kế, lỗi không phá layout.
- 3) Tùy biến & phân quyền: Một phần — vào đúng flow landlord; chưa hiển thị lỗi tài khoản bị khóa (UserStatus.LOCKED) vì mock không có auth thật.
- 4) Bao dung & phục hồi: Đạt — không mất dữ liệu đã nhập khi validation fail.
- 5) Khả năng mở rộng: Một phần — sẵn sàng nối `POST /auth/login`; "Tiếp tục với Google" và "Quên mật khẩu?" vẫn chưa có backend (OAuth/forgot chưa tồn tại).
**Remaining gaps:** Chưa có thông báo sai mật khẩu/tài khoản khóa từ server; Google sign-in là chức năng chưa được backend hỗ trợ.


## Luồng Admin

### EVAL — Admin flow (C1–C7)

Đánh giá sau khi implement lớp chức năng trên mock data cho flow Admin
(`src/app/admin/**` + `AdminTopbar`), đối chiếu `docs/FUNCTION_MAP.md`.
Trạng thái dùng chung nằm ở `src/lib/admin-store.ts` (localStorage, tiền tố
`roomix:admin:`) — C2/C3/C7/Topbar đọc cùng một nguồn quyết định kiểm duyệt.

Thang điểm mỗi tiêu chí: **Đạt / Một phần / Chưa đạt / Không áp dụng** + 1 dòng bằng chứng.

---

### 1. Login — `/admin/login` (C1)

**Hàm đã khớp:** UC01.2 (`POST /api/auth/login`) · UC01.6 (xác thực khuôn mặt Admin).
**Backend thật:** face-auth-service là **vỏ rỗng — 0 endpoint** (không controller, không
logic quét); gateway vẫn route `/api/face/**` tới đó. Màn hình này là **mock seam** và
ghi rõ điều đó ngay trên UI (“Mô phỏng — face-auth-service chưa có endpoint nào ở backend”).

**Điều chỉnh đã làm:**
- Gate tuần tự thật: form validate inline trước (bắt buộc nhập, định dạng email,
  mật khẩu ≥ 8 ký tự, `autoComplete=email/current-password`, Enter = submit qua `<form>`);
  nút quét bị disabled cho tới khi thông tin hợp lệ.
- Bấm “Bắt đầu quét” → trạng thái `scanning` (1,8s, scan-line pulse) → `success` → nút “Vào Dashboard”.
- Badge “Rủi ro thấp · Thiết bị quen thuộc” **chỉ xuất hiện như kết quả quét** — không còn
  khẳng định trước khi quét; step indicator 1→2 được duyệt thật theo phase; có “Dùng tài khoản khác” để quay lại.

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Đạt | Lỗi hiện inline dưới đúng field kèm `role="alert"`, Enter submit được, mỗi phase chỉ có 1 hành động chính. |
| 2. Mật độ & phân cấp dữ liệu | Đạt | Giữ nguyên split card Figma; verdict rủi ro chỉ chiếm 1 badge sau khi quét xong, không chen vào trạng thái chờ. |
| 3. Tùy biến & phân quyền | Không áp dụng | Màn hình là cổng 1 vai trò (ADMIN) cố định — không có bề mặt tùy biến/phân quyền nào để đánh giá. |
| 4. Bao dung & phục hồi | Một phần | Sai định dạng/thiếu field được sửa tại chỗ không mất dữ liệu, nhưng quét mô phỏng luôn thành công — chưa có nhánh quét thất bại/thử lại hay xử lý đăng nhập bất thường (đúng kịch bản cốt lõi của UC01.6). |
| 5. Khả năng mở rộng | Một phần | Phase state machine (`credentials→ready→scanning→success`) thay được bằng call thật, nhưng chưa có lớp gọi API — backend chưa tồn tại endpoint để nối. |

**Gap còn lại:** face-auth-service cần được backend xây từ 0 (endpoint quét + verdict rủi ro +
fallback khi quét fail/khóa tạm); đăng nhập thật (JWT, tài khoản bị `LOCKED`) chưa nối — hiện chỉ validate phía client.

---

### 2. Dashboard — `/admin` (C2)

**Hàm đã khớp:** UC07.8 (thống kê hệ thống — **backend không có endpoint thống kê**),
UC07.5 (phòng trống toàn hệ thống), UC07.4/UC07.6/UC07.2 (số cần chú ý).
**Backend thật:** số chờ duyệt lấy được từ `GET /api/admin/posts`; còn lại phải tự tổng hợp khi nối API.

**Điều chỉnh đã làm:**
- “Cần chú ý” tính từ **cùng admin-store** mà C3/C5/C4 dùng: chờ kiểm duyệt = `moderationQueue`
  trừ decisions đã lưu; báo cáo = reports `PENDING`; chờ xác minh = users `PENDING_VERIFICATION` —
  duyệt 1 bài ở C3 là số ở đây giảm ngay, không còn lệch nhau.
- Mỗi mục trong strip là `Link` tới đúng hàng chờ (báo cáo → C5, kiểm duyệt → C3,
  xác minh → C4 kèm `?status=PENDING_VERIFICATION` và C4 tự áp filter đó).
- Ưu tiên thị giác: báo cáo = nền/viền đỏ nhạt, kiểm duyệt = hổ phách khi count > 0, xác minh = trung tính.

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Không áp dụng | Màn hình không có form; thao tác duy nhất là 1 click từ strip “Cần chú ý” tới đúng hàng chờ. |
| 2. Mật độ & phân cấp dữ liệu | Đạt | Strip giữ 3 mục, mỗi mục chỉ gồm count + nhãn + mũi tên, mục khẩn (báo cáo) được tô đỏ nổi hơn 2 mục còn lại. |
| 3. Tùy biến & phân quyền | Chưa đạt | Không có bộ chọn kỳ/nhà hay tùy biến KPI nào — ngoài strip “Cần chú ý”, toàn bộ số liệu vẫn là hằng số mock. |
| 4. Bao dung & phục hồi | Đạt | Không có hành động phá hủy ở màn này; count suy ra từ store nên không tồn tại trạng thái cũ mâu thuẫn với hàng chờ. |
| 5. Khả năng mở rộng | Một phần | Count “Cần chú ý” đã đi qua store (thay bằng API là xong), nhưng KPI/biểu đồ tăng trưởng/donut bài đăng vẫn là số tĩnh chưa tổng hợp từ dữ liệu thật. |

**Gap còn lại:** UC07.8 cần endpoint thống kê ở backend; tỉ lệ trống vẫn ước tính từ
`rooms × (100 − occupancy)` của mock landlords, chưa phải dữ liệu phòng thật.

---

### 3. Moderation queue — `/admin/moderation` (C3)

**Hàm đã khớp:** UC04.7 (duyệt — `POST /api/admin/posts/{id}/approve`), UC04.8 (từ chối kèm lý do —
`POST .../reject`, body `PostRejectionRequest{reason}`), UC07.4 (quản lý nội dung).
**Backend thật:** approve/reject **có** endpoint; gỡ bài đã duyệt (UC04.9) **chưa có** endpoint.

**Điều chỉnh đã làm:**
- Duyệt/Từ chối ghi quyết định vào store (persist localStorage): bài **rời hàng chờ**, count ở
  header, badge “Kiểm duyệt” trên `AdminTopbar` và strip C2 cùng giảm.
- Từ chối mở modal nhập lý do: **bắt buộc** (trống = lỗi inline, không đóng modal), lý do được
  lưu và hiển thị ở mục “Đã xử lý trong phiên này” + toast.
- Cả hai hành động qua `ConfirmDialog`/modal xác nhận; toast có nút **Hoàn tác** khôi phục bài về
  hàng chờ (mục đã xử lý cũng có nút Hoàn tác riêng); checklist “Kiểm tra nhanh” bấm bật/tắt được thay vì chấm xanh tĩnh.

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Đạt | Duyệt = 1 confirm; từ chối nhập lý do ngay trong modal của hàng chờ, không phải chuyển màn. |
| 2. Mật độ & phân cấp dữ liệu | Đạt | Hàng chờ chỉ chứa bài PENDING; quyết định đã xong tách xuống card riêng kèm lý do từ chối, không lẫn với việc chưa làm. |
| 3. Tùy biến & phân quyền | Một phần | Chưa có tìm kiếm/lọc/sắp xếp hàng chờ hay phân công người duyệt — danh sách vẫn là 1 cột tuyến tính theo mock data. |
| 4. Bao dung & phục hồi | Đạt | Mọi quyết định đều có Hoàn tác (toast 6s + nút trong danh sách đã xử lý) và đều qua bước xác nhận trước khi thực thi. |
| 5. Khả năng mở rộng | Một phần | Decision map keyed theo `postId` map 1-1 với 2 endpoint approve/reject, nhưng UC04.9 (gỡ bài đã APPROVED) chưa có cả UI lẫn endpoint. |

**Gap còn lại:** chưa gỡ/ẩn được bài đã duyệt khỏi danh sách công khai; chưa có filter khi hàng chờ dài;
quyết định mới chỉ persist ở localStorage của trình duyệt (mock seam qua `src/services/api.ts` chưa nối).

---

### 4. Moderation detail — `/admin/moderation/[id]` (C7)

**Hàm đã khớp:** UC04.7, UC04.8, UC07.4 — cùng endpoint AdminPost như C3.
**Trước đây:** nút Duyệt/Từ chối là `Link` về hàng chờ và **không ghi gì** — hai màn kiểm duyệt rời nhau.

**Điều chỉnh đã làm:**
- Chuyển thành client page dùng **chung store với C3**: quyết định ở đây làm bài biến mất khỏi
  hàng chờ C3 (và ngược lại, bài đã quyết ở C3 sang đây sẽ hiện badge + lý do + nút Hoàn tác, không cho quyết lại).
- Từ chối dùng ô lý do ngay trong panel: trống → lỗi inline và không mở confirm; có lý do →
  `ConfirmDialog` trích nguyên văn lý do trước khi thực thi. Duyệt cũng qua `ConfirmDialog`.
- Sau khi quyết: toast Hoàn tác + tự quay về hàng chờ; checklist 3 mục bấm bật/tắt được;
  hành động được append vào audit log của C6 (đúng lời hứa “sẽ được ghi vào nhật ký” trên UI).

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Đạt | Lý do nhập 1 lần ngay trong panel kiểm duyệt, confirm hiển thị lại nguyên văn trước khi gửi — không nhập trùng. |
| 2. Mật độ & phân cấp dữ liệu | Đạt | Panel phải chỉ chứa checklist + verdict + lý do + 2 hành động; ảnh/mô tả/tiện ích nằm cột trái, không tranh chấp thứ bậc. |
| 3. Tùy biến & phân quyền | Một phần | Checklist tùy chỉnh được theo từng bài, nhưng chưa có ghi chú nội bộ, gắn cờ ưu tiên hay chuyển người duyệt. |
| 4. Bao dung & phục hồi | Đạt | Đã quyết rồi vẫn Hoàn tác được ngay tại màn này; bài đã có quyết định không thể bị quyết chồng lần hai. |
| 5. Khả năng mở rộng | Một phần | Dùng chung decision store với C3 nên nối API chỉ sửa 1 chỗ, nhưng mô tả phòng vẫn là 1 chuỗi mẫu dùng cho mọi bài (mock data chưa có description theo bài). |

**Gap còn lại:** UC04.9 (gỡ bài vi phạm từ chi tiết) chưa có; ảnh/checklist chưa lấy từ kết quả AI thật nào.

---

### 5. Users — `/admin/users` (C4)

**Hàm đã khớp:** UC07.1/07.2/07.3, UC01.5 — backend có đủ: `GET /api/admin/users`,
`POST .../lock|unlock`, `POST .../approve-landlord|reject-landlord` (body có lý do).
**Trước đây:** xác minh chủ trọ **không tồn tại** trên UI dù dashboard khoe “3 chủ trọ chờ xác minh”,
và type dùng chung không biểu diễn được `PENDING_VERIFICATION`.

**Điều chỉnh đã làm:**
- Store admin định nghĩa `AdminUser` mở rộng (không sửa `src/types/*`): thêm 3 chủ trọ
  `PENDING_VERIFICATION` làm hàng chờ xác minh thật; badge “Chờ xác minh” riêng.
- Duyệt xác minh qua `ConfirmDialog`; từ chối xác minh qua modal **bắt buộc lý do** (lý do được lưu
  và hiện trong panel chi tiết); cả hai có toast Hoàn tác.
- Khóa/Mở khóa qua `ConfirmDialog` **nêu hậu quả cụ thể kèm tên + email** (“sẽ không thể đăng nhập
  cho tới khi Admin mở khóa”) + toast Hoàn tác khôi phục đúng trạng thái trước.
- Tìm kiếm (tên/email/SĐT/nhà) + chip vai trò (Tất cả/Chủ trọ/Khách thuê kèm count) + chip trạng thái
  kèm count + dòng “Hiển thị X / Y”; panel chi tiết hiện email/SĐT/nhà/số phòng thay vì chỉ 1 câu tĩnh.

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Đạt | Tìm + 2 hàng chip lọc cho kết quả tức thì kèm “Hiển thị X / Y”; xác minh chủ trọ làm ngay trong panel chi tiết. |
| 2. Mật độ & phân cấp dữ liệu | Đạt | Mỗi dòng chỉ còn tên + vai trò/nhà + email + ngày tham gia + 1 badge trạng thái; chi tiết liên hệ dồn vào panel dưới. |
| 3. Tùy biến & phân quyền | Một phần | Lọc được theo vai trò/trạng thái và có deep-link `?status=`, nhưng chưa có thao tác hàng loạt hay lưu bộ lọc. |
| 4. Bao dung & phục hồi | Đạt | Khóa, duyệt và từ chối xác minh đều qua confirm nêu hậu quả và đều Hoàn tác được về đúng trạng thái trước đó. |
| 5. Khả năng mở rộng | Một phần | Map đủ 4 endpoint lock/unlock/approve/reject-landlord, nhưng danh sách properties của chủ trọ (`GET .../{id}/properties`) mới hiện dạng tổng hợp nhà/số phòng, chưa có danh sách chi tiết. |

**Gap còn lại:** type dùng chung `UserAccount` vẫn thiếu `PENDING_VERIFICATION`/`ADMIN` (nợ type drift ở
`FUNCTION_MAP §3.3` — cần coordinator sửa khi nối API); chưa có phân trang khi số tài khoản lớn.

---

### 6. Reports — `/admin/reports` (C5) — ⚠️ UI-AHEAD-OF-BACKEND

**Hàm đã khớp (trên giấy):** UC07.6 (quản lý báo cáo vi phạm), UC04.9 (gỡ bài từ báo cáo).
**Backend thật: UC07.6 KHÔNG CÓ MODULE NÀO** — không entity, không controller, không DTO;
UC04.9 cũng không có endpoint gỡ bài. **Toàn bộ màn hình này đi trước backend**: trạng thái
PENDING/RESOLVED/DISMISSED là quy ước frontend tự đặt, UI ghi rõ “Chế độ mô phỏng — UC07.6 chưa có module backend”.

**Điều chỉnh đã làm (chỉ ở mức mock):**
- “Gỡ bài đăng” và “Đóng báo cáo · Không vi phạm” đều qua `ConfirmDialog` (dialog gỡ bài ghi rõ đây là
  thao tác mô phỏng vì backend chưa có endpoint) + toast **Hoàn tác** về trạng thái trước.
- Báo cáo đã xử lý/đã đóng có nút “Mở lại báo cáo” (về PENDING); thêm chip lọc theo trạng thái kèm count + “Hiển thị X / Y”.
- Trạng thái persist trong admin-store nên count báo cáo ở Dashboard C2 khớp với màn này.

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Đạt (mock) | Lọc trạng thái 1 click; xử lý 1 báo cáo = chọn + confirm, không rời màn. |
| 2. Mật độ & phân cấp dữ liệu | Một phần | Danh sách đã gọn (lý do + phòng + người báo cáo + ngày), nhưng vẫn chưa có link sang bài đăng/phòng bị báo cáo để đối chiếu tại chỗ. |
| 3. Tùy biến & phân quyền | Một phần | Có lọc theo trạng thái, chưa có gán người xử lý, mức ưu tiên hay hạn xử lý. |
| 4. Bao dung & phục hồi | Đạt (mock) | Cả hai kết luận đều Hoàn tác được và báo cáo đã đóng/mở lại được về PENDING bất cứ lúc nào. |
| 5. Khả năng mở rộng | Chưa đạt | Không tồn tại backend để mở rộng tới — cần backend xây module UC07.6 (entity + trạng thái chuẩn + endpoint gỡ bài UC04.9) trước khi màn này nối được API. |

**Gap còn lại:** “Gỡ bài đăng” hiện chỉ đổi trạng thái báo cáo trong store — **không có bài nào thực sự bị
gỡ** ở C3/L3 vì chưa có bề mặt dữ liệu/endpoint chung cho việc gỡ; cần backend định nghĩa enum trạng thái báo cáo khi xây UC07.6.

---

### 7. Notifications & Audit log — `/admin/notifications` (C6)

**Hàm đã khớp:** UC07.7 (tạo + gửi thông báo tới tất cả/chủ trọ/khách thuê), UC07.9 (audit log: ai, hành động, thời gian, đối tượng).
**Backend thật:** Notification **không có POST** (chỉ `GET` list/unread-count + `PATCH` mark-read — thông báo do
hệ thống tự sinh qua Kafka); AuditLog có entity + service ghi nhưng **không có endpoint đọc**.
Cả hai nửa của màn này đều chưa có backend để nối — compose và log dưới đây là mock có chủ đích.

**Điều chỉnh đã làm:**
- Compose validate inline cả tiêu đề và nội dung (trống = lỗi tại field, giữ nguyên dữ liệu đã nhập);
  gửi thành công ghi vào **lịch sử đã gửi** (tiêu đề/nội dung/đối tượng/thời gian) trong store + toast nói rõ là mô phỏng.
- Thêm danh sách **thông báo của Admin** (dữ liệu `notificationsAdmin` trước đây không màn nào dùng):
  click để đánh dấu đã đọc, “Đánh dấu đã đọc tất cả”, badge “Mới” + count chưa đọc (khớp `PATCH .../read`, `/read-all` khi nối API).
- Audit log: **tìm kiếm** + lọc theo **người thực hiện** + lọc theo **loại hành động** (options suy ra từ dữ liệu)
  + dòng “Hiển thị X / Y”; timestamp hiện **đầy đủ ngày + giờ** (trước đây bị cắt mất ngày);
  các hành động thật trong phiên (duyệt/từ chối bài, khóa/xác minh user, xử lý báo cáo, gửi thông báo) được append lên đầu log.

| Tiêu chí | Điểm | Bằng chứng |
|---|---|---|
| 1. Hiệu suất nhập liệu | Đạt (mock) | Validate inline giữ nguyên nội dung khi lỗi; audit tìm/lọc cho kết quả tức thì mà không cần tải lại trang. |
| 2. Mật độ & phân cấp dữ liệu | Đạt | Audit mỗi mục 2 dòng (ai + hành động + đối tượng / thời gian đầy đủ), lọc nằm gọn trên danh sách kèm count “Hiển thị X / Y”. |
| 3. Tùy biến & phân quyền | Một phần | Đối tượng gửi chọn được 3 nhóm (tất cả/chủ trọ/khách thuê) đúng UC07.7, nhưng chưa chọn được từng người/nhà cụ thể. |
| 4. Bao dung & phục hồi | Một phần | Thông báo đã đọc khôi phục trạng thái đọc/xem được và lịch sử gửi được giữ lại, nhưng thông báo đã “gửi” không thu hồi/xóa được. |
| 5. Khả năng mở rộng | Một phần | Mark-read map thẳng tới `PATCH` có sẵn và log đã có cấu trúc actor/action/target/time, nhưng broadcast + đọc audit vẫn chờ backend bổ sung endpoint POST/GET. |

**Gap còn lại:** cần backend quyết định endpoint tạo/broadcast thông báo (UC07.7) và endpoint đọc audit log
(UC07.9, kèm phân trang — hiện log render toàn bộ); thông báo “đã gửi” chưa có kênh giao thật (Kafka/WebSocket chưa nối).
