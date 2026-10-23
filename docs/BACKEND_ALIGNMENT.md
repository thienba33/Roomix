# Backend và kế hoạch điều chỉnh Roomix — 22/10/2026

## Phạm vi và mức độ kiểm chứng

Đọc trực tiếp controller, DTO, entity, service implementation, enum và cấu hình gateway trong `../Roomix_Backend`. Đây là đánh giá mã nguồn, chưa chạy backend, migration hoặc kiểm thử tích hợp với DB/Kafka. “Đã triển khai” không đồng nghĩa đã kiểm chứng production. Các form FE hiện vẫn mô phỏng; đợt 1 chỉ chuẩn hóa hợp đồng nhập liệu.

## Kiến trúc

- Gateway 8080 → core 8081, rental 8082, RAG 8083, face 8084 (cổng mặc định).
- Core dùng PostgreSQL `core_db`; rental dùng PostgreSQL `rental_db`; Hibernate validate schema. Rental bật Flyway. Các quan hệ liên dịch vụ dùng ID, không phải JPA join giữa hai database.
- RAG có ChromaDB và dịch vụ AI; cần cấu hình mô hình và nạp dữ liệu để hoạt động.
- Face chỉ có application/config OpenAPI; route gateway tồn tại nhưng chưa có controller nghiệp vụ.

## Chức năng đã có mã triển khai và khoảng trống

| Nhóm | Đã triển khai trong mã nguồn | Điều chỉnh FE / còn thiếu |
|---|---|---|
| Xác thực | Login username/password; register; JWT; GET hồ sơ | Không dùng email/số điện thoại cho login. Tenant đăng ký nhận token; landlord PENDING_VERIFICATION không nhận token. Chưa có forgot/reset, refresh, logout hoặc Google OAuth endpoint. |
| Người dùng | Admin tìm kiếm, chi tiết, tài sản chủ trọ, khóa/mở khóa, duyệt/từ chối chủ trọ | Hồ sơ hiện chỉ có GET /me, chưa có API cập nhật hồ sơ. |
| Phòng/tin | Tìm kiếm và chi tiết; chủ trọ tạo/sửa multipart, gửi duyệt, ẩn/hiện; admin duyệt/từ chối | Không suy ra API CRUD nhà/tầng hay danh sách riêng chủ trọ từ entity. Chưa thấy các endpoint này. Bộ lọc FE phải theo RoomSearchRequest. |
| Yêu thích | Thêm/xóa bằng roomId; liệt kê | Database lưu theo postId; không gửi ID số mock. |
| Thông báo | Phân trang, số chưa đọc, đánh dấu một/tất cả; có cơ chế push | Cài đặt bật/tắt hiện tại chưa có endpoint tương ứng. |
| Thuê phòng | Gửi/hủy yêu cầu; chủ trọ nhận/từ chối; hợp đồng, xác nhận cọc, hủy/kết thúc | Có kiểm tra trạng thái và chống trùng thuê trong service. FE cần theo trạng thái backend. |
| Hóa đơn | Tạo, danh sách, chi tiết; tenant xác nhận/khiếu nại; landlord ghi nhận trả tiền/giải quyết khiếu nại | /pay là ghi nhận bởi chủ trọ, không phải cổng thanh toán online. |
| Quyết toán | Preview/complete/get; hiệu chỉnh hóa đơn có lịch sử; nhắc nợ | Cần màn hình tương ứng, kiểm tra số tiền và trạng thái từ server. |
| AI | Chat RAG, định giá, ingest dữ liệu | Phụ thuộc cấu hình AI/vector store; chưa kiểm chứng đầu cuối. |
| Chưa có API nghiệp vụ | Face auth, chat tenant–landlord, đánh giá sao, dashboard/report tổng hợp | Gateway /api/chat và /api/face không chứng minh tính năng đã hoàn thành. |

## Các đợt triển khai

**Cập nhật theo yêu cầu:** tất cả các đợt dùng mock chạy độc lập, mô phỏng DTO, phản hồi và chuyển trạng thái backend. Chưa kết nối HTTP và không cần môi trường backend. Nối API thật là bước riêng sau cùng.

1. **Đã làm:** kiểm kê API/entity; chỉnh username đăng nhập và validation đăng ký theo DTO. Giữ luồng demo hiện tại và ghi rõ ranh giới.
2. **Đã thực hiện bước mock tài khoản:** login/register qua mock service, vai trò từ tài khoản, lỗi sai mật khẩu/khóa/chờ duyệt, tenant đăng ký nhận phiên và landlord chờ duyệt, phiên hết hạn/đăng xuất. Bỏ thao tác chưa có backend khỏi form. Chi tiết và giới hạn tại `AUTH_FLOW.md`.
3. **Đã thực hiện mock:** phòng/tìm kiếm/chi tiết/yêu thích dùng UUID, phân trang, bộ lọc đúng DTO, public visibility và yêu thích theo tài khoản. Chi tiết và ranh giới với kho rental/admin cũ tại `ROOM_DISCOVERY_FLOW.md`.
4. **Đã thực hiện mock:** kho phòng/tin chung, tạo nháp/chỉnh sửa/thêm ảnh/gửi duyệt, admin duyệt/từ chối, ẩn/hiện, đồng bộ public và yêu thích. Danh sách nhà/tầng dùng fixture bổ trợ vì thiếu endpoint. Xem `LISTING_MODERATION_FLOW.md` về phạm vi và giới hạn.
5. **Đã làm mock đợt 5a:** yêu cầu thuê → hợp đồng → xác nhận cọc, kho UUID chung theo quyền sở hữu; xem `RENTAL_FLOW.md`. **Tiếp theo:** hóa đơn/công tơ/khiếu nại → quyết toán/kết thúc thuê/nhắc nợ.
6. Thông báo realtime, AI; báo cáo và chức năng thiếu chỉ tích hợp khi có hợp đồng backend.

## Hợp đồng quan trọng

- Login: username bắt buộc tối đa 50, password bắt buộc tối đa 72. Không áp minimum 8 cho đăng nhập; minimum 8 thuộc đăng ký.
- Register: username regex 4–50 ký tự; fullName không trắng tối đa 100; email tối đa 254; password 8–72; phoneNumber `^\+?[0-9]{9,15}$`; role TENANT/LANDLORD. Kiểm tra email FE là kiểm tra cơ bản; backend Jakarta Email quyết định cuối cùng.
- AuthServiceImpl: tenant ACTIVE có token; landlord PENDING_VERIFICATION trả user, expiresIn=0, không token. Không tự cho vào dashboard sau đăng ký chủ trọ.
- Tìm phòng: minPrice/maxPrice, minArea, location, amenities, sort, page (từ 0), size 1–100.
- Core trả ApiResponse và PageResponse; rental trả ApiResponse với Spring Page. Cần adapter riêng thay vì giả định cùng cấu trúc phân trang.
- RoomStatus: AVAILABLE/OCCUPIED/RESERVED/MAINTENANCE. PostStatus: DRAFT/PENDING/APPROVED/REJECTED/HIDDEN.
- RequestStatus: PENDING/ACCEPTED/REJECTED/CANCELLED. TenancyStatus: PENDING/ACTIVE/ENDED/CANCELLED.
- InvoiceStatus: PENDING/CONFIRMED/PAID; khiếu nại là cờ disputed, không phải enum status mới.

## API Java (từ annotation controller)

Đường dẫn /internal là giao tiếp nội bộ, không đưa thành nút hoặc API client trình duyệt. Quyền còn được kiểm tra trong SecurityConfig và service ngoài các annotation controller.

### core-service

| Method | Endpoint | Controller |
|---|---|---|
| GET | `/api/admin/posts` | `AdminPostController` |
| POST | `/api/admin/posts/{postId}/approve` | `AdminPostController` |
| POST | `/api/admin/posts/{postId}/reject` | `AdminPostController` |
| GET | `/api/admin/users` | `AdminUserController` |
| GET | `/api/admin/users/{userId}` | `AdminUserController` |
| GET | `/api/admin/users/{userId}/properties` | `AdminUserController` |
| POST | `/api/admin/users/{userId}/lock` | `AdminUserController` |
| POST | `/api/admin/users/{userId}/unlock` | `AdminUserController` |
| POST | `/api/admin/users/{userId}/approve-landlord` | `AdminUserController` |
| POST | `/api/admin/users/{userId}/reject-landlord` | `AdminUserController` |
| POST | `/api/auth/login` | `AuthController` |
| POST | `/api/auth/register` | `AuthController` |
| POST | `/api/favorites/{roomId}` | `FavoriteController` |
| DELETE | `/api/favorites/{roomId}` | `FavoriteController` |
| GET | `/api/favorites` | `FavoriteController` |
| GET | `/internal/rental/rooms/{roomId}` | `InternalRentalController` |
| GET | `/internal/rental/account` | `InternalRentalController` |
| POST | `/api/landlords/rooms` | `LandlordRoomController` |
| PUT | `/api/landlords/rooms/{roomId}` | `LandlordRoomController` |
| POST | `/api/landlords/rooms/{roomId}/submit` | `LandlordRoomController` |
| POST | `/api/landlords/rooms/{roomId}/hide` | `LandlordRoomController` |
| POST | `/api/landlords/rooms/{roomId}/unhide` | `LandlordRoomController` |
| GET | `/api/notifications` | `NotificationController` |
| GET | `/api/notifications/unread-count` | `NotificationController` |
| PATCH | `/api/notifications/{notificationId}/read` | `NotificationController` |
| PATCH | `/api/notifications/read-all` | `NotificationController` |
| GET | `/api/rooms/search` | `RoomController` |
| GET | `/api/rooms/{roomId}` | `RoomController` |
| GET | `/api/users/me` | `UserController` |

### rental-service

| Method | Endpoint | Controller |
|---|---|---|
| POST | `/api/invoices` | `InvoiceController` |
| GET | `/api/invoices` | `InvoiceController` |
| GET | `/api/invoices/{invoiceId}` | `InvoiceController` |
| POST | `/api/invoices/{invoiceId}/confirm` | `InvoiceController` |
| POST | `/api/invoices/{invoiceId}/pay` | `InvoiceController` |
| POST | `/api/invoices/{invoiceId}/dispute` | `InvoiceController` |
| POST | `/api/invoices/{invoiceId}/resolve-dispute` | `InvoiceController` |
| POST | `/api/invoices/{invoiceId}/corrections` | `InvoiceCorrectionController` |
| GET | `/api/invoices/{invoiceId}/corrections` | `InvoiceCorrectionController` |
| GET | `/api/invoices/reminders` | `InvoiceReminderController` |
| POST | `/api/invoices/{invoiceId}/remind` | `InvoiceReminderController` |
| POST | `/api/rentals` | `RentalRequestController` |
| GET | `/api/rentals` | `RentalRequestController` |
| GET | `/api/rentals/{requestId}` | `RentalRequestController` |
| POST | `/api/rentals/{requestId}/cancel` | `RentalRequestController` |
| POST | `/api/rentals/{requestId}/accept` | `RentalRequestController` |
| POST | `/api/rentals/{requestId}/reject` | `RentalRequestController` |
| GET | `/api/tenancies` | `TenancyController` |
| GET | `/api/tenancies/{tenancyId}` | `TenancyController` |
| POST | `/api/tenancies/{tenancyId}/confirm-deposit` | `TenancyController` |
| POST | `/api/tenancies/{tenancyId}/cancel` | `TenancyController` |
| POST | `/api/tenancies/{tenancyId}/end` | `TenancyController` |
| POST | `/api/tenancies/{tenancyId}/settlement/preview` | `TenancySettlementController` |
| POST | `/api/tenancies/{tenancyId}/settlement` | `TenancySettlementController` |
| GET | `/api/tenancies/{tenancyId}/settlement` | `TenancySettlementController` |

### RAG qua gateway

- POST `/api/ai/chat`
- POST `/api/ai/pricing/predict`
- POST `/api/ai/ingest/rooms`
- POST `/api/ai/ingest/init-sample-data`
- Gateway đổi `/api/ai/*` thành `/api/v1/*`; ingest là thao tác quản trị, không đưa vào luồng khách thuê.

## Entity và trường dữ liệu

Danh sách lấy từ entity JPA. Chưa truy vấn database chạy thật; migration/constraint có thể thêm ràng buộc ngoài entity.

Quan hệ chính: User (landlordId) → House → Floor → Room → Post; RoomImage gắn phòng; Favorite nối User và Post. RentalRequest → Tenancy (bảng contracts) → Invoice/MeterReading/Settlement. Invoice → InvoiceItem/Correction/Reminder. Nhiều liên kết là UUID scalar, không phải quan hệ ORM. TenancyEvent phục vụ sự kiện/outbox; ProcessedRentalEvent chống xử lý sự kiện trùng.

### core-service

| Entity | Bảng | Trường |
|---|---|---|
| AuditLog | audit_logs | `id: UUID`, `userId: UUID`, `action: String`, `entityName: String`, `entityId: String`, `oldValues: Map<String, Object>`, `newValues: Map<String, Object>`, `ipAddress: String`, `userAgent: String`, `createdAt: Instant` |
| Favorite | favorites | `id: UUID`, `tenant: User`, `post: Post`, `createdAt: Instant` |
| Floor | floors | `id: UUID`, `house: House`, `floorNumber: int`, `name: String`, `rooms: List<Room>` |
| House | houses | `id: UUID`, `landlordId: UUID`, `name: String`, `addressStreet: String`, `ward: String`, `district: String`, `city: String`, `totalFloors: int`, `floors: List<Floor>`, `createdAt: Instant`, `updatedAt: Instant` |
| Notification | notifications | `id: UUID`, `userId: UUID`, `title: String`, `content: String`, `type: NotificationType`, `referenceId: UUID`, `read: boolean`, `readAt: Instant`, `createdAt: Instant` |
| Post | posts | `id: UUID`, `landlordId: UUID`, `roomId: UUID`, `room: Room`, `title: String`, `description: String`, `rentalPrice: BigDecimal`, `depositAmount: BigDecimal`, `availableFrom: LocalDate`, `status: PostStatus`, `rejectReason: String`, `viewCount: long`, `approvedBy: UUID`, `approvedAt: Instant`, `createdAt: Instant`, `updatedAt: Instant` |
| ProcessedRentalEvent | processed_rental_events | `eventId: UUID`, `roomId: UUID`, `eventSequence: long`, `eventType: String`, `processedAt: Instant` |
| Room | rooms | `id: UUID`, `floor: Floor`, `roomNumber: String`, `area: BigDecimal`, `basePrice: BigDecimal`, `maxTenants: int`, `status: RoomStatus`, `hasPrivateBathroom: boolean`, `hasAirConditioner: boolean`, `hasWaterHeater: boolean`, `hasBalcony: boolean`, `amenitiesDescription: String`, `rented: boolean`, `createdAt: Instant`, `updatedAt: Instant` |
| RoomImage | room_images | `id: UUID`, `room: Room`, `imageUrl: String`, `primary: boolean`, `displayOrder: int`, `uploadedAt: Instant` |
| User | users | `id: UUID`, `username: String`, `email: String`, `passwordHash: String`, `fullName: String`, `phoneNumber: String`, `avatarUrl: String`, `role: Role`, `status: UserStatus`, `createdAt: Instant`, `updatedAt: Instant` |

### rental-service

| Entity | Bảng | Trường |
|---|---|---|
| ActiveTenancy | active_tenancies | `id: UUID`, `roomId: UUID`, `tenancyId: UUID`, `tenantId: UUID`, `checkInDate: LocalDate`, `assignedAt: Instant` |
| Invoice | invoices | `id: UUID`, `invoiceCode: String`, `tenancyId: UUID`, `meterReadingId: UUID`, `billingMonth: String`, `dueDate: LocalDate`, `totalAmount: BigDecimal`, `paidAmount: BigDecimal`, `status: InvoiceStatus`, `revision: int`, `disputed: boolean`, `disputeReason: String`, `disputeResolution: String`, `confirmedAt: Instant`, `paymentDate: Instant`, `paymentMethod: String`, `createdAt: Instant`, `updatedAt: Instant` |
| InvoiceCorrection | invoice_corrections | `id: UUID`, `invoiceId: UUID`, `revision: int`, `correctedBy: UUID`, `reason: String`, `oldValues: InvoiceSnapshot`, `newValues: InvoiceSnapshot`, `createdAt: Instant` |
| InvoiceItem | invoice_items | `id: UUID`, `invoiceId: UUID`, `itemName: String`, `itemType: InvoiceItemType`, `quantity: BigDecimal`, `unitPrice: BigDecimal`, `totalPrice: BigDecimal` |
| InvoiceReminder | invoice_reminders | `id: UUID`, `invoiceId: UUID`, `tenantId: UUID`, `landlordId: UUID`, `reminderDate: LocalDate`, `outstandingAmount: BigDecimal`, `content: String`, `createdAt: Instant` |
| MeterReading | meter_readings | `id: UUID`, `tenancyId: UUID`, `roomId: UUID`, `billingMonth: String`, `oldElectricityVal: BigDecimal`, `newElectricityVal: BigDecimal`, `electricityUsage: BigDecimal`, `oldWaterVal: BigDecimal`, `newWaterVal: BigDecimal`, `waterUsage: BigDecimal`, `recordedBy: UUID`, `readingDate: LocalDate`, `createdAt: Instant` |
| RentalRequest | rental_requests | `id: UUID`, `roomId: UUID`, `postId: UUID`, `tenantId: UUID`, `landlordId: UUID`, `note: String`, `status: RequestStatus`, `rejectReason: String`, `createdAt: Instant`, `updatedAt: Instant` |
| Tenancy | contracts | `id: UUID`, `contractCode: String`, `rentalRequestId: UUID`, `roomId: UUID`, `landlordId: UUID`, `tenantId: UUID`, `startDate: LocalDate`, `endDate: LocalDate`, `actualReturnDate: LocalDate`, `monthlyRent: BigDecimal`, `depositAmount: BigDecimal`, `electricityUnitPrice: BigDecimal`, `waterUnitPrice: BigDecimal`, `initialElectricity: BigDecimal`, `initialWater: BigDecimal`, `status: TenancyStatus`, `termsAndConditions: String`, `cancellationReason: String`, `depositConfirmedAt: Instant`, `depositDeadline: Instant`, `createdAt: Instant`, `updatedAt: Instant` |
| TenancyEvent | tenancy_events | `sequence: Long`, `eventId: UUID`, `eventType: TenancyEventType`, `roomId: UUID`, `tenancyId: UUID`, `partitionKey: String`, `topic: String`, `occurredAt: Instant`, `publishedAt: Instant`, `attemptCount: int`, `nextAttemptAt: Instant`, `lastError: String` |
| TenancySettlement | tenancy_settlements | `id: UUID`, `tenancyId: UUID`, `actualReturnDate: LocalDate`, `lastBilledMonth: String`, `unbilledMonths: int`, `previousElectricity: BigDecimal`, `finalElectricity: BigDecimal`, `previousWater: BigDecimal`, `finalWater: BigDecimal`, `monthlyRent: BigDecimal`, `electricityUnitPrice: BigDecimal`, `waterUnitPrice: BigDecimal`, `damageCharge: BigDecimal`, `invoiceDebt: BigDecimal`, `additionalRent: BigDecimal`, `additionalElectricity: BigDecimal`, `additionalWater: BigDecimal`, `totalDue: BigDecimal`, `depositAmount: BigDecimal`, `depositApplied: BigDecimal`, `amountToCollect: BigDecimal`, `amountToRefund: BigDecimal`, `collectedAmount: BigDecimal`, `refundedAmount: BigDecimal`, `damageReason: String`, `paymentMethod: String`, `settledBy: UUID`, `createdAt: Instant`, `invoiceBalances: Map<String, BigDecimal>` |

## Kiểm chứng tiếp theo

Chạy từng service với PostgreSQL/Kafka và cấu hình cần thiết; xác minh migration, seed nhà/tầng, tài khoản test theo vai trò; chạy các luồng tích hợp và lỗi quyền. Hiện chưa có bằng chứng runtime để gắn nhãn “hoàn thiện” cho từng module.

## Ràng buộc database đã đối chiếu migration

- Core: foreign key từ house → user, floor → house, room → floor, post → room/user; favorite unique `(tenant_id, post_id)`. Migration V4 mở rộng PostStatus thêm DRAFT.
- Rental: unique index `uq_room_open_contract` chỉ cho một hợp đồng PENDING/ACTIVE trên mỗi phòng; ngày kết thúc phải sau ngày bắt đầu.
- Chỉ số công tơ và hóa đơn unique theo `(contract_id, billing_month)`; invoice item unique `(invoice_id, item_type)`.
- Hiệu chỉnh unique `(invoice_id, revision)`; quyết toán unique `contract_id`; nhắc nợ unique `(invoice_id, reminder_date)`.
- UI phải xử lý xung đột đồng thời từ server, không chỉ khóa nút ở trình duyệt. Phương thức thanh toán quyết toán trong schema là CASH/BANK_TRANSFER.
- SecurityConfig chuẩn hóa username đăng nhập bằng strip/lowercase trước khi tìm UserRepository. Việc chuẩn hóa đăng ký phải kiểm tra đồng bộ trước khi tích hợp thật.

## Rà soát sau đợt 5a — hồ sơ, quyền truy cập, tổng quan

- Đối chiếu lại UserController và UserProfileResponse: chỉ có GET `/api/users/me`, không có cập nhật hồ sơ/đổi mật khẩu. Hai trang hồ sơ nay đọc tài khoản mock hiện hành; bỏ ghi đè bằng profile dùng chung, thông báo đổi mật khẩu thành công giả, xác minh email/CCCD giả và contact card chưa có luồng gửi thật. Không suy ra trạng thái xác minh từ ACTIVE.
- AuthProvider công bố trạng thái đã tải phiên; layout chủ trọ chờ tải rồi chặn khách chưa đăng nhập/sai vai trò. Đây chỉ là guard UI mock, API thật vẫn phải kiểm tra quyền phía server.
- Tổng quan chủ trọ tính phòng, tỷ lệ lấp đầy, yêu cầu, hợp đồng chờ cọc và bài nháp/từ chối từ kho chung theo landlordId. Phòng đang chờ cọc không được tính là còn trống sẵn sàng nhận thuê trong tổng quan. Bỏ biểu đồ doanh thu và hoạt động cố định khỏi trang tổng quan.
- Sidebar/header dùng danh tính đăng nhập; đăng xuất chủ trọ mở đúng vai trò đăng nhập. Chi tiết phòng bỏ thông báo thành công cũ có thể còn sau chuyển tài khoản; liên kết hợp đồng đưa chủ trọ về khu vực phù hợp.
- Còn lại: hóa đơn, thống kê riêng, thông báo và quản trị tài khoản vẫn cần chuyển từ kho cũ. Chưa tuyên bố những module đó đồng bộ với hợp đồng mới. Cài đặt thông báo ở menu hiện vẫn là tùy chọn cục bộ.
