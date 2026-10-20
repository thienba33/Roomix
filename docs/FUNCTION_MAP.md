# FUNCTION_MAP — Roomix: Use Case ↔ Backend ↔ Frontend

Phase 0 deliverable of the functional UI/UX alignment pass. Every screen section below was
written after reading the actual page code (not the Figma file), the actual backend code,
and the Use Case document.

**Sources & versions (verified 2026-10-21)**

| Source | Version / location |
|---|---|
| Use Case document | `~/workspace/user/files/Bo_Use_Case.docx` — 7 main UC, 54 sub-UC (extracted in full) |
| Backend | Fresh clone of `https://github.com/Siro25/Roomix_Backend.git` @ `615544b` (Merge PR #14) |
| Frontend | This repo @ `b806261` (clean tree at start of phase) |
| Data mode | Frontend is **mock-only**: `src/services/api.ts` returns `src/lib/data.ts`; it is the seam for real calls later |

**How to read a screen section:** `UC` = sub-UC codes the screen serves · `Backend` = the
endpoints/functions that would back it · `Gaps` = concrete functional gaps found in the
current UI code — dead controls the UC requires, missing UC functions, or UI functions that
neither the UC nor the backend supports.

---

## 1. Use Case inventory (54 sub-UC, from Bo_Use_Case.docx)

### UC01 — Quản lý tài khoản & phân quyền
| Code | Function | Actor |
|---|---|---|
| UC01.1 | Đăng ký tài khoản (chọn vai trò, kiểm tra trùng email/username) | Tenant, Landlord |
| UC01.2 | Đăng nhập theo vai trò | Tenant, Landlord, Admin |
| UC01.3 | Đăng xuất (kết thúc phiên) | All |
| UC01.4 | Quản lý thông tin cá nhân (xem + cập nhật) | All |
| UC01.5 | Phân quyền người dùng theo vai trò | System |
| UC01.6 | Xác thực đăng nhập Admin bằng AI (phát hiện đăng nhập bất thường) | Admin |

### UC02 — Tìm kiếm & kết nối phòng trọ
| Code | Function | Actor |
|---|---|---|
| UC02.1 | Tìm kiếm phòng (địa điểm, giá, từ khóa) | Tenant |
| UC02.2 | Lọc phòng (giá, diện tích, khu vực, số người, tiện ích, trạng thái) | Tenant |
| UC02.3 | Sắp xếp kết quả (giá, diện tích, thời gian đăng, mức phù hợp) | Tenant |
| UC02.4 | Xem chi tiết phòng | Tenant |
| UC02.5 | Xem thông tin chủ trọ (hồ sơ + các bài đăng của chủ trọ) | Tenant |
| UC02.6 | Quan tâm phòng (gửi yêu cầu) | Tenant |
| UC02.7 | Chủ trọ xử lý yêu cầu quan tâm (chấp nhận / từ chối kèm lý do) | Landlord |
| UC02.8 | Gửi danh thiếp chủ trọ (Contact Card — chỉ sau khi ACCEPTED) | System |

### UC03 — Quản lý nhà & phòng trọ
| Code | Function | Actor |
|---|---|---|
| UC03.1 | Quản lý nhà (thêm / xem / sửa / xóa nhà) | Landlord |
| UC03.2 | Quản lý tầng thuộc một nhà | Landlord |
| UC03.3 | Quản lý phòng thuộc từng tầng | Landlord |
| UC03.4 | Quản lý trạng thái phòng | Landlord |
| UC03.5 | Cập nhật thông tin phòng (giá, diện tích, nội thất, tiện ích, số người, mô tả) | Landlord |
| UC03.6 | Theo dõi phòng trống (tổng / đang thuê / trống / tỷ lệ lấp đầy) | Landlord |

### UC04 — Quản lý bài đăng cho thuê
| Code | Function | Actor |
|---|---|---|
| UC04.1 | Tạo bài đăng | Landlord |
| UC04.2 | Xem bài đăng của mình | Landlord |
| UC04.3 | Sửa bài đăng | Landlord |
| UC04.4 | Xóa bài đăng | Landlord |
| UC04.5 | Ẩn / hiện bài đăng | Landlord |
| UC04.6 | Gửi bài đăng để kiểm duyệt | Landlord |
| UC04.7 | Admin duyệt bài đăng | Admin |
| UC04.8 | Admin từ chối bài đăng (kèm lý do phản hồi) | Admin |
| UC04.9 | Admin gỡ / xóa bài đăng vi phạm | Admin |

### UC05 — Quản lý khách thuê & tài chính
| Code | Function | Actor |
|---|---|---|
| UC05.1 | Quản lý khách thuê | Landlord |
| UC05.2 | Phân phòng cho khách (gán khách vào phòng trống) | Landlord |
| UC05.3 | Quản lý hợp đồng (tạo, cập nhật, xem, kết thúc) | Landlord |
| UC05.4 | Trả phòng (hoàn tất, phòng về AVAILABLE) | Landlord |
| UC05.5 | Ghi chỉ số điện (và tính thành tiền) | Landlord |
| UC05.6 | Ghi chỉ số nước (và tính thành tiền) | Landlord |
| UC05.7 | Tính tiền hàng tháng (tổng các khoản phải thu) | Landlord |
| UC05.8 | Tạo hóa đơn | Landlord |
| UC05.9 | Theo dõi thanh toán | Landlord |
| UC05.10 | Thống kê tài chính (phải thu / doanh thu theo thời gian) | Landlord |

### UC06 — AI hỗ trợ tìm kiếm & tư vấn
| Code | Function | Actor |
|---|---|---|
| UC06.1 | Chatbot tư vấn phòng bằng ngôn ngữ tự nhiên | Tenant |
| UC06.2 | Phân tích nhu cầu người dùng → tiêu chí tìm kiếm có cấu trúc | AI |
| UC06.3 | AI RAG tìm kiếm thông tin phòng (trả lời có căn cứ) | AI |
| UC06.4 | AI đề xuất phòng theo mức độ phù hợp | AI |
| UC06.5 | Hỏi đáp về một phòng cụ thể | Tenant |
| UC06.6 | AI hỗ trợ tìm kiếm nâng cao (nhiều tiêu chí, có ngữ cảnh) | Tenant |

### UC07 — Quản trị & thông báo hệ thống
| Code | Function | Actor |
|---|---|---|
| UC07.1 | Quản lý tài khoản toàn hệ thống | Admin |
| UC07.2 | Quản lý chủ trọ (danh sách + trạng thái) | Admin |
| UC07.3 | Quản lý khách thuê (tài khoản + trạng thái) | Admin |
| UC07.4 | Quản lý nội dung (bài đăng / nội dung hệ thống) | Admin |
| UC07.5 | Theo dõi phòng trống toàn hệ thống | Admin |
| UC07.6 | Quản lý báo cáo (tiếp nhận + xử lý báo cáo vi phạm) | Admin |
| UC07.7 | Quản lý thông báo (tạo + gửi tới khách / chủ trọ / tất cả) | Admin |
| UC07.8 | Xem thống kê hệ thống (Dashboard) | Admin |
| UC07.9 | Quản lý lịch sử hoạt động (audit log: ai, hành động, thời gian, đối tượng) | Admin |

---

## 2. Backend inventory (verified against code @ 615544b)

Gateway (`api-gateway`): `/api/auth|users|rooms|favorites|admin|landlords|notifications/**`
→ core-service · `/api/rentals|tenancies|invoices|chat/**` → rental-service ·
`/api/ai/**` → rag-service (rewritten to `/api/v1/**`) · `/api/face/**` → face-auth-service ·
`/api/ws/**` → core-service WebSocket. Note: gateway routes `/api/chat/**` to
*rental-service*, which has no chat controller — chat actually lives in rag-service.

### 2.1 core-service — Auth / User
| Endpoint | Function |
|---|---|
| `POST /api/auth/register` | Register. DTO `RegisterRequest`: username (`^[a-zA-Z0-9._-]{4,50}$`), fullName, email, password (8–72), phoneNumber (required), role (default `TENANT`) |
| `POST /api/auth/login` | Login → `AuthResponse` (JWT) |
| `GET /api/users/me` | Current profile (`UserProfileResponse`) — **the only User endpoint** |

Backend gaps: **no logout endpoint, no profile update (no PUT/PATCH /me), no
forgot/change-password, no user delete.**

### 2.2 core-service — Rooms (public)
| Endpoint | Function |
|---|---|
| `GET /api/rooms/search` | Search. `RoomSearchRequest`: minPrice, maxPrice, minArea, location, amenities[], sort (default `newest`), page/size |
| `GET /api/rooms/{roomId}` | Detail → `RoomDetailResponse` (postId, house/floor names, price, deposit, area, maxTenants, availableFrom, boolean amenity flags, amenitiesDescription, imageUrls, rented/available — **no landlord contact fields, no rating**) |

### 2.3 core-service — LandlordRoom
| Endpoint | Function |
|---|---|
| `POST /api/landlords/rooms` (multipart) | Create room + post. DTO `LandlordRoomRequest` requires **existing `houseId` + `floorId`**, roomNumber, area, basePrice, maxTenants, bathroom/AC/water-heater/balcony flags, amenitiesDescription, title, description, depositAmount, availableFrom, + image files |
| `PUT /api/landlords/rooms/{roomId}` (multipart) | Update room/post (same DTO) |
| `POST /api/landlords/rooms/{roomId}/submit` | Submit post for moderation (DRAFT → PENDING) |
| `POST /api/landlords/rooms/{roomId}/hide` · `/unhide` | Hide / unhide post |

Entities `House` and `Floor` exist, and `RoomDetailResponse` exposes house/floor names —
but **there is no House/Floor controller**: no endpoint creates, lists, edits or deletes a
house or floor, yet room creation requires their IDs (UC03.1/UC03.2 have entities only).
**No DELETE endpoint** for rooms/posts (UC04.4 unsupported). No landlord "my rooms/posts"
list endpoint either — the landlord UI lists would have to be derived from search/admin
DTOs (`LandlordRoomResponse`, `LandlordPropertyResponse` exist as DTOs).

### 2.4 core-service — Favorite
| Endpoint | Function |
|---|---|
| `POST /api/favorites/{roomId}` · `DELETE /api/favorites/{roomId}` · `GET /api/favorites` | Add / remove / list favorites (`FavoriteResponse`) |

### 2.5 core-service — Notification
| Endpoint | Function |
|---|---|
| `GET /api/notifications` · `GET /api/notifications/unread-count` | List + unread count (`NotificationType`: SYSTEM, INVOICE, POST_APPROVAL, INTEREST_REQUEST, GENERAL) |
| `PATCH /api/notifications/{id}/read` · `PATCH /api/notifications/read-all` | Mark read / mark all read |

**No POST endpoint exists** — neither an admin broadcast (UC07.7) nor a landlord-to-tenant
message can be created through this API; notifications are produced internally by
services (Kafka `NotificationMessage`). WebSocket push exists at gateway `/api/ws/**`.

### 2.6 core-service — AdminPost / AdminUser / AuditLog
| Endpoint | Function |
|---|---|
| `GET /api/admin/posts` | Moderation queue (`AdminPostResponse`) |
| `POST /api/admin/posts/{postId}/approve` | Approve |
| `POST /api/admin/posts/{postId}/reject` | Reject with `PostRejectionRequest` (reason) |
| `GET /api/admin/users` · `GET /api/admin/users/{userId}` · `GET /api/admin/users/{userId}/properties` | User list / detail / a landlord's properties |
| `POST /api/admin/users/{userId}/lock` · `/unlock` | Lock / unlock account |
| `POST /api/admin/users/{userId}/approve-landlord` · `/reject-landlord` | Verify or reject a pending landlord (body `LandlordRejectionRequest`) |

`AuditLog` entity + `AuditService`/`AuditLogRepository` exist and moderation actions are
recorded, but **there is no controller endpoint that reads the audit log** (UC07.9 is
write-only in the backend). AdminPost has **no remove/delete/hide endpoint** — UC04.9
(admin gỡ bài) is only partially backed (approve/reject exist; takedown does not).
No admin statistics/dashboard endpoint exists (UC07.8 unbacked).

### 2.7 rental-service — RentalRequest
| Endpoint | Function |
|---|---|
| `POST /api/rentals` | Tenant sends interest request. DTO `SendRentalRequest`: roomId, note |
| `GET /api/rentals` · `GET /api/rentals/{requestId}` | List / detail (returns the `RentalRequest` entity: id, roomId, postId, tenantId, landlordId, note, status, rejectReason, timestamps — **no contact fields on the request itself**) |
| `POST /api/rentals/{requestId}/cancel` | Tenant cancels own request |
| `POST /api/rentals/{requestId}/accept` | Landlord accepts with `AcceptRentalRequest` (startDate, endDate, monthlyRent, depositAmount, electricityUnitPrice, waterUnitPrice, initialElectricity, initialWater, termsAndConditions, depositDeadline) → **creates and returns a `Tenancy`** |
| `POST /api/rentals/{requestId}/reject` | Reject with `ReasonRequest` |

Contact Card (UC02.8): contact details are **not** a field of the request response; the
landlord's contact is delivered out-of-band (notification flow) once ACCEPTED. Any UI must
not invent a contact payload on the request DTO.

### 2.8 rental-service — Tenancy / Settlement
| Endpoint | Function |
|---|---|
| `GET /api/tenancies` · `GET /api/tenancies/{tenancyId}` | List / detail (`Tenancy`: contractCode, dates, monthlyRent, deposit, unit prices, initial readings, status, depositConfirmedAt/depositDeadline, cancellationReason) |
| `POST /api/tenancies/{id}/confirm-deposit` | Confirm deposit received |
| `POST /api/tenancies/{id}/cancel` | Cancel tenancy (reason) |
| `POST /api/tenancies/{id}/end` | End tenancy (`EndTenancyRequest`) |
| `POST /api/tenancies/{tenancyId}/settlement/preview` | Checkout settlement preview (`SettlementPreviewRequest`) |
| `POST /api/tenancies/{tenancyId}/settlement` · `GET …/settlement` | Complete / read settlement (`TenancySettlement`) |

There is **no standalone "assign tenant to room" endpoint** (UC05.2): assignment happens
only through RentalRequest accept (UC02.7), which creates the Tenancy with all terms.

### 2.9 rental-service — Invoice / MeterReading / Correction / Reminder
| Endpoint | Function |
|---|---|
| `POST /api/invoices` | Create invoice. `CreateInvoiceRequest`: tenancyId, billingMonth, dueDate, readingDate, **old/new electricity + old/new water readings** — meter readings (UC05.5/UC05.6) are submitted *inside* invoice creation; `MeterReading` is an entity/repository with **no controller of its own** |
| `GET /api/invoices` · `GET /api/invoices/{invoiceId}` | List / detail (`InvoiceDetailResponse`: `overdue` **boolean derived from due date**, outstandingAmount, invoice, meterReading, items[]) |
| `POST /api/invoices/{id}/confirm` · `/pay` (`PaymentRequest`) | Confirm / record payment (UC05.9) |
| `POST /api/invoices/{id}/dispute` · `/resolve-dispute` | Tenant disputes an invoice; landlord resolves |
| `POST /api/invoices/{invoiceId}/corrections` · `GET …/corrections` | Invoice corrections (`CorrectInvoiceRequest` → `InvoiceCorrection`) |
| `GET /api/invoices/reminders` · `POST /api/invoices/{invoiceId}/remind` | Reminder list / send reminder (`InvoiceReminder`) |

No finance-statistics endpoint exists (UC05.10 unbacked — numbers must be aggregated
client-side from invoice lists).

### 2.10 rag-service (FastAPI, prefix `/api/v1`)
| Endpoint | Function |
|---|---|
| `POST /api/v1/chat` | RAG chat. `ChatRequest`: message, conversation_history[], user_role (TENANT/LANDLORD), filters (`SearchFilters`: city, district, min/max price, min/max area, room_type, amenities) → `ChatResponse`: answer, matched_rooms[], source_documents[], suggested_follow_ups[] |
| `POST /api/v1/pricing/predict` | Price prediction. Request: city, district, ward, room_type, area_sqm, amenities, mezzanine/studio/parking/newly-built flags, floor → recommended_price, estimated min/max, confidence_score, breakdown, market_analysis, comparable_rooms[] |
| `POST /api/v1/ingest/rooms` · `POST /api/v1/ingest/init-sample-data` | Index rooms into the vector store (internal/admin tooling, not an end-user function) |
| `GET /health` | Health check |

### 2.11 face-auth-service
**The service is an empty shell**: `src/main` contains only the application class and an
`OpenApiConfig` — no controller, no endpoint, no face-verification logic at all (gateway
still routes `/api/face/**` to it). UC01.6 therefore has **no backend implementation**;
any face-scan UI is necessarily a simulation until this service is built.

### 2.12 Enums — all "known facts" verified TRUE against code
| Enum | Values (code) |
|---|---|
| `Role` | TENANT, LANDLORD, ADMIN |
| `UserStatus` | ACTIVE, LOCKED, **PENDING_VERIFICATION** |
| `RoomStatus` | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE |
| `PostStatus` | DRAFT, PENDING, APPROVED, REJECTED, HIDDEN |
| `RequestStatus` | PENDING, ACCEPTED, REJECTED, **CANCELLED** |
| `TenancyStatus` | PENDING, ACTIVE, ENDED, CANCELLED |
| `TenancyEventType` | TENANCY_ACTIVATED, TENANCY_ENDED |
| `InvoiceStatus` | PENDING, CONFIRMED, PAID — **no OVERDUE** (overdue is a derived boolean on `InvoiceDetailResponse`) |
| `InvoiceItemType` | ROOM_RENT, ELECTRICITY, WATER — **only these three** (no service/other fee) |
| `NotificationType` | SYSTEM, INVOICE, POST_APPROVAL, INTEREST_REQUEST, GENERAL |

**Confirmed: violation reports (UC07.6) have NO backend module** — no entity, controller,
or DTO anywhere in the repo.

---

## 3. Frontend inventory — 28 routes + 5 overlay/state screens

### 3.1 Routes (`src/app/**/page.tsx`)
| # | Route | File | Flow |
|---|---|---|---|
| T1 | `/` | `src/app/page.tsx` + `HomeContent.tsx` | Tenant — home / search |
| T2 | `/rooms/[id]` | `src/app/rooms/[id]/page.tsx` | Tenant — room detail |
| T3 | `/favorites` | `src/app/favorites/page.tsx` | Tenant — favorites |
| T4 | `/requests` | `src/app/requests/page.tsx` | Tenant — my requests |
| T5 | `/ai` | `src/app/ai/page.tsx` | Tenant — home with AI panel pre-opened |
| T6 | `/states` | `src/app/states/page.tsx` | Tenant — empty/loading showcase (not a UC screen) |
| T7 | `/login` | `src/app/(auth)/login/page.tsx` | Tenant — login |
| T8 | `/register` | `src/app/(auth)/register/page.tsx` | Tenant/Landlord — register |
| T9 | `/notifications` | `src/app/notifications/page.tsx` | Tenant — notifications (UC07.7 receiver) |
| T10 | `/profile` | `src/app/profile/page.tsx` | Tenant — profile (UC01.4) |
| L1 | `/landlord` | `src/app/landlord/page.tsx` | Landlord — dashboard ("Hôm nay") |
| L2 | `/landlord/rooms` | `src/app/landlord/rooms/page.tsx` | Landlord — houses & rooms |
| L3 | `/landlord/listings` | `src/app/landlord/listings/page.tsx` | Landlord — my posts |
| L4 | `/landlord/listings/create` | `src/app/landlord/listings/create/page.tsx` | Landlord — create post (3-step wizard UI) |
| L5 | `/landlord/requests` | `src/app/landlord/requests/page.tsx` | Landlord — interest requests |
| L6 | `/landlord/tenants` | `src/app/landlord/tenants/page.tsx` | Landlord — tenants & contracts |
| L7 | `/landlord/invoices` | `src/app/landlord/invoices/page.tsx` | Landlord — meter readings & invoices |
| L8 | `/landlord/statistics` | `src/app/landlord/statistics/page.tsx` | Landlord — finance statistics |
| L9 | `/landlord/notifications` | `src/app/landlord/notifications/page.tsx` | Landlord — notifications + compose |
| L10 | `/landlord/profile` | `src/app/landlord/profile/page.tsx` | Landlord — profile + Contact Card preview |
| L11 | `/landlord/login` | `src/app/landlord/login/page.tsx` | Landlord — login |
| A1 | `/admin` | `src/app/admin/page.tsx` | Admin — system dashboard |
| A2 | `/admin/moderation` | `src/app/admin/moderation/page.tsx` | Admin — moderation queue |
| A3d | `/admin/moderation/[id]` | `src/app/admin/moderation/[id]/page.tsx` | Admin — moderation detail |
| A4 | `/admin/users` | `src/app/admin/users/page.tsx` | Admin — user management |
| A5 | `/admin/reports` | `src/app/admin/reports/page.tsx` | Admin — violation reports |
| A6n | `/admin/notifications` | `src/app/admin/notifications/page.tsx` | Admin — broadcast + audit log |
| A7 | `/admin/login` | `src/app/admin/login/page.tsx` | Admin — login + face auth |

### 3.2 Overlay / state screens (no own route)
| Code | Screen | File | Host |
|---|---|---|---|
| A3 | AI chat panel (docked right panel) | `src/components/layouts/AiPanel.tsx` | TenantHeader, all tenant screens (+ `/ai` pre-opens it) |
| A6 | Filter modal (advanced filters) | `src/components/layouts/FilterModal.tsx` | T1 home |
| A9 | Avatar dropdown menu | inside `src/components/layouts/TenantHeader.tsx` | All tenant screens |
| B12 | Reject-request modal (reason picker) | `src/components/layouts/RejectModal.tsx` | L5 landlord requests |
| B13 | Invoice detail drawer | `src/components/layouts/InvoiceDrawer.tsx` | L7 landlord invoices |

### 3.3 Type drift in `src/types/index.ts` vs backend (fix before wiring real APIs)
| Frontend type | Backend truth | Impact |
|---|---|---|
| `RequestStatus = PENDING \| ACCEPTED \| REJECTED` | + `CANCELLED` | Tenant cancel (UC02.6 flow) cannot be represented |
| `InvoiceStatus` includes `OVERDUE` | Statuses are PENDING/CONFIRMED/PAID; overdue is derived from `dueDate` | UI treats a derived flag as a stored status (L7 chips, B13 tones, `invoiceStatusLabel`) |
| `Tenant.status = ACTIVE \| ENDING \| ENDING…` (`ACTIVE/ENDING/ENDED`) | `TenancyStatus = PENDING/ACTIVE/ENDED/CANCELLED` — no `ENDING` | "Sắp hết hạn" is a UI invention; must be derived from `endDate` |
| `UserAccount.role` has no `ADMIN`; `status` = ACTIVE/LOCKED only | + `PENDING_VERIFICATION` | Pending-verification landlords (approve/reject-landlord) cannot be represented in A4 |
| `InvoiceItem` is a free-text label | `InvoiceItemType = ROOM_RENT/ELECTRICITY/WATER` | UI invents a "Phí dịch vụ" (service fee) line — see T2/L7 |
| `Room.rating`, stars on cards | No rating field anywhere in backend | Ratings are decorative data with no source |
| IDs are `number` everywhere | Backend IDs are UUID strings | Mock seam only; types must change when wiring |

---

## 4. Screen-by-screen function map

### T1 — `/` Home / Search (`HomeContent.tsx`)
- **UC:** UC02.1 (search), UC02.2 (filter — via A6), UC02.3 (sort), UC02.6-adjacent favorite toggle (backend Favorite), UC06 entry point (AI pill in header).
- **Backend:** `GET /api/rooms/search` (keyword→`location`, min/maxPrice, minArea, amenities, sort, paging); `POST/DELETE /api/favorites/{roomId}`; `GET /api/favorites`.
- **Works (mock):** text search over name/area/house with debounce; room grid; empty state message; opens A6.
- **Gaps:**
  1. **Category row is dead as a filter** — `setCategory` only changes the underline; "Phòng đơn / Phòng đôi / Nguyên căn / Gần trường / Ban công / Máy giặt" never filter the list. Backend search has no `room_type` either (room_type exists only in rag-service `SearchFilters`), so categories currently map to nothing on either side.
  2. **A6 filter selections are never applied** — FilterModal keeps its own state and "Áp dụng" only closes the modal (see A6). UC02.2 is therefore not functionally served despite a complete-looking UI.
  3. **No sort control at all** (UC02.3) — backend supports `sort` (default `newest`); UI has no price/area/newest sorting.
  4. **Result count is hardcoded** — subtitle says "128 phòng đang trống" regardless of the actual list/filter result.
  5. **Favorite heart is local-only** — `RoomCard` toggles component state; it neither calls the favorites API seam nor affects T3 `/favorites` (which renders a separate static `favoriteRooms` array). Un-hearting on T3 is impossible (page is a server component with fixed data).
  6. Search matches only name/area/house strings; backend `location` + price/amenity criteria from A6 never combine with the keyword.

### T2 — `/rooms/[id]` Room detail
- **UC:** UC02.4 (detail), UC02.5 (landlord info), UC02.6 (send interest request), UC02.8 (locked contact explanation), UC06.5 (ask AI about this room — via the "Hỏi AI" button).
- **Backend:** `GET /api/rooms/{roomId}` (`RoomDetailResponse`); `POST /api/rentals` (`SendRentalRequest`: roomId + note); rag `POST /api/v1/chat` with room context for UC06.5.
- **Works (mock):** gallery mosaic, specs, amenities, monthly-cost breakdown, landlord block, other-rooms list (links work), locked-contact explanation card.
- **Gaps:**
  1. **"Gửi yêu cầu quan tâm" button is dead** — no `onClick`, no note/message input, no navigation. This is the core conversion action of UC02.6; a tenant cannot send a request from anywhere in the UI (T4 only lists pre-seeded requests).
  2. **"Hỏi AI về phòng này" button is dead** — it does not open the A3 panel or pass room context (UC06.5 unserved).
  3. **Monthly-cost breakdown invents a "Phí dịch vụ 100.000đ" line** — `InvoiceItemType` has only ROOM_RENT/ELECTRICITY/WATER, so this total (3.350.000đ) cannot be reproduced by a real invoice. Electricity/water figures are also hardcoded constants (350.000đ/100.000đ) for every room instead of unit prices × expected usage.
  4. **Specs are hardcoded** — "Tối đa 2 người" and "Đặt cọc 1 tháng" are literals, not the room's `maxTenants`/`depositAmount` (both exist in `RoomDetailResponse`); `availableFrom` is never shown.
  5. **UC02.5 is only a stub** — landlord name + "12 phòng đang cho thuê" are static text; there is no landlord profile view, and the count is not derived from data (only the "other rooms" links are real).
  6. No favorite heart on the detail page (favorite can only be toggled from cards).
  7. Page is statically generated from mock `rooms` (`generateStaticParams`) — fine for mock phase, noted for the API seam.

### T3 — `/favorites` Favorites
- **UC:** Favorite list (supports UC02.1/UC02.6 flow; backed by the Favorite module — no dedicated UC code, it is the UI surface of the backend Favorite feature).
- **Backend:** `GET /api/favorites`, `DELETE /api/favorites/{roomId}`.
- **Works (mock):** grid of saved rooms with cards.
- **Gaps:**
  1. **Data is a static import** (`favoriteRooms` = `rooms[1]`, `rooms[3]`) — completely disconnected from the heart toggles on T1 cards; adding/removing a favorite anywhere never changes this page.
  2. No remove action on this page itself (hearts render but the page is a server component; toggling is local to the card and lost on navigation).
  3. No empty state here (the empty-favorites state exists only as a showcase on T6 `/states`).

### T4 — `/requests` My requests (tenant)
- **UC:** UC02.6 (track own requests), UC02.8 (Contact Card revealed on ACCEPTED).
- **Backend:** `GET /api/rentals` (own list), `POST /api/rentals/{requestId}/cancel`, status incl. `CANCELLED`; reject reason comes from the request's `rejectReason` field.
- **Works (mock):** status badges; Contact Card (phone/Zalo/email) shown only when ACCEPTED — the UC02.8 gating rule is correctly modelled.
- **Gaps:**
  1. **No cancel action** — backend supports cancel + `CANCELLED` status; the UI `RequestStatus` type lacks `CANCELLED` and a PENDING request offers no way to withdraw it.
  2. **The only actionable button is a dev simulation** — "Mô phỏng: chủ trọ chấp nhận" lets the *tenant* accept their own request. It exists to demo the Contact Card unlock but is not a real user function and must not survive into the functional build.
  3. **Reject reason is hardcoded** ("Lý do: phòng đã có người đặt trước") for every rejected request instead of the request's own `rejectReason`; the tenant's own sent message/note is never displayed.
  4. No empty state for "no requests yet"; no link from a request to re-view the room when `roomId` is missing (fallback block is inert).

### T5 — `/ai` AI route
- **UC:** UC06.1–UC06.6 (entry point).
- **Backend:** rag-service `POST /api/v1/chat`.
- **Works (mock):** renders T1 home with the A3 panel pre-opened (`defaultAiOpen`).
- **Gaps:** the route adds nothing beyond A3 — all functional gaps are A3's (see A3). Having both a route and a panel for the same function is a duplication the alignment pass should resolve deliberately (keep the panel pattern per the design decision; the route currently exists only to deep-link it open).

### T6 — `/states` Empty/loading showcase
- **UC:** none — this is a design-system showcase (empty favorites + skeleton grid), not a user function.
- **Backend:** none.
- **Gaps:** the states shown here are **not wired into the real screens**: T3 has no empty state, T1 shows a plain text line instead of the skeleton while "loading", and no screen has a real loading state (mock data is synchronous). Keep as a reference; do not count it as a product screen.

### T7 — `/login` Tenant login
- **UC:** UC01.2 (login), UC01.3 (logout is in A9), UC01.5 (role routing).
- **Backend:** `POST /api/auth/login` → JWT + role.
- **Works (mock):** form submit navigates to `/`; show/hide password.
- **Gaps:**
  1. **No validation or error path** — empty/wrong credentials "succeed"; UC01.2's exceptions (wrong password, locked account `UserStatus.LOCKED`) cannot be shown.
  2. **"Quên mật khẩu?" is a dead `href="#"` link** — and the backend has no forgot-password endpoint either (gap on both sides; UC01 does not require it, but the UI promises it).
  3. **"Tiếp tục với Google" button is dead** (no handler) — no OAuth exists in backend or UC; unsupported function presented as available.
  4. No role choice/awareness: a landlord logging in here lands on the tenant home (landlords have L11; nothing routes by role after login).

### T8 — `/register` Register
- **UC:** UC01.1 (register with role choice), UC01.5.
- **Backend:** `POST /api/auth/register` (`RegisterRequest`: username, fullName, email, password, **phoneNumber required**, role).
- **Works (mock):** role toggle (Khách thuê / Chủ trọ) matching `RegisterRequest.role`; submit navigates to `/login`.
- **Gaps:**
  1. **Form cannot satisfy the backend DTO** — it collects only full name, "Email hoặc số điện thoại" (one combined field) and password; the backend requires a pattern-valid `username`, a separate `email`, and a mandatory `phoneNumber`. Three required fields have no inputs.
  2. **No validation/exception handling** — UC01.1's exceptions (duplicate email/username, missing required data, password < 8 chars) have no UI path; every submit "succeeds".
  3. "Tiếp tục với Google" button is dead and unsupported (same as T7).
  4. A landlord who registers here is sent to the tenant `/login`, not L11 (minor routing inconsistency).

### T9 — `/notifications` Tenant notifications
- **UC:** UC07.7 (notification receiver side).
- **Backend:** `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` (list is produced internally by services — no POST exists).
- **Works (mock):** list seeded from the tenant story across all 5 `NotificationType` values; unread count in subtitle and on the header bell badge (same store); row click marks read; "Đánh dấu tất cả đã đọc" with Undo; filter chips per type with counts; "Hiển thị X / Y"; empty state per filter — all persisted in the tenant store (localStorage).
- **Gaps:** no realtime push (gateway WebSocket `/api/ws/**` not wired — mock seam only); seed times are relative strings, not timestamps; no per-item delete (backend has none).

### T10 — `/profile` Tenant profile
- **UC:** UC01.4 (view + update own information), notification preferences.
- **Backend:** `GET /api/users/me` exists; **no update endpoint yet** — profile edits, preferences and change-password run on the mock seam (tenant store) until the backend grows them.
- **Works (mock):** header card (identity, verified email/phone rows); edit form (name/phone required with inline validation, optional address) persisted to the store, with the header/dropdown identity following the saved name; cancel restores; change-password card (show/hide, inline rules) with success toast; notification preferences — master switch shared two-way with the A9 dropdown plus email/in-app/push channel switches, all persisted; quick links to T4/T3/T9.
- **Gaps:** no account deletion (backend has none — deliberately not invented); no edit history/undo for profile saves; email is the login identity and stays read-only here.

### A3 — AI panel (`AiPanel.tsx`, docked panel + `/ai`)
- **UC:** UC06.1 (chat), UC06.2 (needs analysis → criteria chips), UC06.3 (RAG answers), UC06.4 (room recommendations with match %), UC06.5 (room Q&A, with T2), UC06.6 (advanced multi-criteria search).
- **Backend:** rag `POST /api/v1/chat` (`ChatResponse`: answer, matched_rooms, source_documents, suggested_follow_ups); gateway `/api/ai/**` → `/api/v1/**`.
- **Works (mock):** opens from the header AI pill on every tenant screen and pre-opened on `/ai`; quick-action pills and suggestion chips append the chosen text as a user message; free-text submit appends the message; close button works; Esc-to-close added in Phase 0.
- **Gaps:**
  1. **The conversation is canned** — the transcript, the "2 phòng khớp nhất" result, the 98%/92% match scores and the extracted-criteria chips (≤ 3 triệu · 2 người · Điều hòa) are hardcoded markup. Any user message gets the same generic reply ("Mình đã ghi nhận — xem các phòng gợi ý ở danh sách bên trái nhé") regardless of content; UC06.2's criteria extraction and UC06.4's ranking are faked, not computed even from mock data.
  2. **Recommended rooms are not links** — clicking a suggested room does nothing (no navigation to T2), so the panel cannot complete the search journey.
  3. **No conversation state model** — no history array matching `ChatRequest.conversation_history`, no follow-up suggestions from `suggested_follow_ups`, no sources display (`source_documents`) for UC06.3's "grounded answer" requirement.
  4. The "+" attach affordance in the input is a decorative span — a dead control.
  5. Panel state does not persist criteria between screens (it remounts with `TenantHeader`), and there is no way to apply AI-extracted criteria to the T1 result list (the UC06.6 hand-off).

### A6 — Filter modal (`FilterModal.tsx`)
- **UC:** UC02.2 (filter: price range, area, amenities, room type), UC02.3 partially (type tabs).
- **Backend:** `GET /api/rooms/search` params minPrice/maxPrice/minArea/amenities — note the backend has **no maxArea and no room_type** parameter, while the modal offers area *bands* and room types.
- **Works (mock):** dual-thumb price slider (1–5tr), area band single-select, amenity multi-select, room-type segmented control, "Xóa lọc" resets local state.
- **Gaps:**
  1. **"Áp dụng · 24 phòng" applies nothing** — the button only calls `onClose`; selections live and die inside the modal, T1's list never changes (the single biggest tenant-flow gap together with T2's dead request button). The "24 phòng" count is a hardcoded literal, not a live count of matching mock rooms.
  2. No active-filter indication on T1 after closing (no chips/summary of applied filters, no way to clear them from the list screen).
  3. Criteria mismatch with backend: area bands (Dưới 20 / 20–30 / Trên 30 m²) vs backend `minArea` only; room types vs no backend field; "KTX" type exists in neither backend nor rag room_type enum (`PHONG_TRO, CHUNG_CU_MINI, CAN_HO_DICH_VU, NHA_NGUYEN_CAN, O_GHEP`).
  4. No occupant-count filter, although UC02.2 lists "số người" and rooms have `maxTenants`.

### A9 — Avatar dropdown (`TenantHeader.tsx`)
- **UC:** UC01.3 (logout), UC01.4 (profile — entry point), notifications preference (no UC/backend function).
- **Backend:** profile via `GET /api/users/me`; logout has no backend endpoint (client-side token discard is the only possible implementation).
- **Works (mock):** shows tenant identity + verified email/phone lines; links to T4/T3; "Đăng xuất" links to `/login`.
- **Gaps:**
  1. **No profile screen exists to link to** — UC01.4 has no tenant UI anywhere (no view/edit profile page; the dropdown shows read-only identity only). Landlord has L10; tenant and admin have nothing.
  2. **"Thông báo · Bật" row is a dead div** — not a toggle, not a link; and the tenant flow has **no notifications screen at all** even though `notificationsTenant` mock data and the full Notification API (list, unread-count, mark-read) exist. UC07.7's tenant receiving end is unserved.
  3. No unread badge anywhere in the tenant header.

### L1 — `/landlord` Landlord dashboard
- **UC:** UC03.6 (vacancy tracking: total / rented / vacant / occupancy), UC05.10 (monthly revenue glimpse), UC02.7/UC05.9 attention items.
- **Backend:** no statistics endpoint exists in either service — all numbers must be aggregated from `GET /api/landlords/rooms`-side data, tenancies and invoices when wired.
- **Works (mock):** 4 KPI cards, revenue bar + line charts, occupancy donut (82%), recent-activity list — all rendered from `lib/data`.
- **Gaps:**
  1. **"Cần xử lý" items are dead text** — "3 yêu cầu quan tâm mới", "2 hóa đơn quá hạn", "1 bài đăng chờ gửi duyệt", "Ghi chỉ số điện tháng 10" look actionable but link nowhere (they should deep-link to L5, L7-overdue, L3, L7 respectively).
  2. All figures are static mock constants (including "+2 phòng mới", "+12% tháng trước") with no derivation from the rooms/tenancies/invoices data the other screens use — the dashboard can silently disagree with L2/L6/L7.
  3. "Hoạt động gần đây" is a static list; the backend's activity source for a landlord would be notifications/audit, neither of which is landlord-readable today.

### L2 — `/landlord/rooms` Houses & rooms
- **UC:** UC03.1 (houses), UC03.2 (floors), UC03.3 (rooms), UC03.4 (room status), UC03.5 (update room info), UC03.6 (vacancy, partial via counts).
- **Backend:** `POST/PUT /api/landlords/rooms` (+ submit/hide/unhide); House/Floor **entities only, no endpoints**.
- **Works (mock):** floor tabs (1–4) filter the room grid; room selection; status badge; "Đổi trạng thái" cycles the room's status locally.
- **Gaps:**
  1. **No create/edit anywhere** — no "add house", "add floor", "add room" or edit-room form exists; the detail panel is read-only (price/area/floor/note). UC03.1, UC03.2, UC03.3 (add side) and UC03.5 are entirely unserved; the page manages exactly one hardcoded house ("4 tầng · 36 phòng" header) while L10 claims the landlord manages 3 houses.
  2. **Status editing is a blind cycle** — "Đổi trạng thái" rotates AVAILABLE → OCCUPIED → RESERVED → MAINTENANCE with no picker, no confirmation and no guard: a landlord can set OCCUPIED without any tenancy (backend reality: occupancy follows tenancies/reservations — `ReservationExpiryService` exists), and there is no undo if clicked by mistake.
  3. No delete room (matches backend — no DELETE endpoint; UC03.3's delete side is unbacked on both sides).
  4. Room detail shows no tenant/tenancy link for OCCUPIED rooms and no post status for the room's listing (the room ↔ post relationship is invisible here).

### L3 — `/landlord/listings` My posts
- **UC:** UC04.2 (view my posts), UC04.3 (edit), UC04.4 (delete), UC04.5 (hide/unhide), UC04.6 (submit draft / resubmit).
- **Backend:** `PUT /api/landlords/rooms/{roomId}` (edit), `POST …/submit`, `POST …/hide`, `POST …/unhide`; **no DELETE** (UC04.4 unbacked).
- **Works (mock):** status filter chips for all 6 states (ALL + 5 `PostStatus` values), counts in header, empty state per filter.
- **Gaps:**
  1. **Rows have zero actions** — no edit, no hide/unhide, no submit-for-review, no delete, no row click-through. UC04.3/04.4/04.5/04.6 are all unserved from the list; a DRAFT post can never be submitted and a REJECTED post can never be fixed or resubmitted from the UI (L4 only creates new posts).
  2. REJECTED posts show no rejection reason (backend stores it via the reject flow) and no guidance state.
  3. Views count is displayed but has no backend source (no view-tracking in `AdminPostResponse`/post DTOs) — decorative metric.

### L4 — `/landlord/listings/create` Create post
- **UC:** UC04.1 (create post), UC04.6 (submit for moderation), plus AI pricing (rag-service; supports UC04.1 pricing, no dedicated UC code).
- **Backend:** `POST /api/landlords/rooms` (multipart, `LandlordRoomRequest`), then `POST …/{roomId}/submit`; `POST /api/v1/pricing/predict` for the AI price card.
- **Works (mock):** room picker pre-fills price/amenities; title/description inputs; "AI gợi ý" fills a canned description; amenity toggles; live tenant-side preview; AI price card with "Áp dụng giá đề xuất" (sets price to 2.800.000đ); "Gửi duyệt" → success screen.
- **Gaps:**
  1. **Required backend fields are missing from the form** — no deposit (`depositAmount`, required), no `availableFrom` (required), no max-tenants, no house/floor selection (creation requires existing `houseId`/`floorId`), no bathroom/AC/water-heater/balcony flags. The form as built cannot produce a valid `LandlordRoomRequest`.
  2. **"Tải ảnh lên" button is dead** — photo upload (the multipart payload's core content) does nothing; the displayed "photos" are silently borrowed from other rooms' galleries, and the "Ảnh bìa" (cover) choice cannot be changed.
  3. **The 3-step wizard is decorative** — steps 1–3 are static chips on a single page; there is no step navigation or per-step validation.
  4. **No "Lưu nháp" (save DRAFT)** — the only exit is "Gửi duyệt", which jumps straight to the "đã gửi duyệt" success state; the DRAFT state that L3 filters by can never be created here.
  5. AI price suggestion is hardcoded copy ("Giá thị trường khu Thanh Xuân: 2,7–3,0tr · Dựa trên 48 phòng") — not computed from mock data, let alone the pricing API shape (no confidence, no range apply logic beyond one fixed number). The AI description is likewise one fixed string for every room.

### L5 — `/landlord/requests` Interest requests (+ B12)
- **UC:** UC02.7 (accept / reject with reason), UC02.8 (Contact Card sent on accept).
- **Backend:** `GET /api/rentals`; `POST /api/rentals/{id}/accept` with `AcceptRentalRequest` → creates `Tenancy`; `POST /api/rentals/{id}/reject` with reason.
- **Works (mock):** list + detail panel; accept flips status and toasts "Contact Card đã được gửi"; reject opens B12, flips status, toasts.
- **Gaps:**
  1. **Accept collects none of the contract terms the backend requires** — one click, no start/end date, rent, deposit, electricity/water unit prices, initial meter readings or deposit deadline form. In backend terms this accept could never create the Tenancy it is supposed to create (UC02.7 → UC05.3 hand-off missing).
  2. **Nothing downstream happens** — an accepted request does not create an entry on L6 (tenants/contracts), does not change the room's status on L2, and the tenant's T4 view is a separate static dataset, so the two sides can disagree.
  3. No CANCELLED state in the landlord list (tenant-cancelled requests would be unrepresentable — same type drift as T4).
  4. Tenant contact stays hidden even after ACCEPTED in the detail panel (only the "đã gửi Contact Card" confirmation shows) — acceptable per UC02.8 (card goes to the tenant), but the landlord gets no record of what was sent.

### B12 — Reject modal (`RejectModal.tsx`)
- **UC:** UC02.7 (reject with reason), feeds `rejectReason` shown to the tenant (T4).
- **Backend:** `POST /api/rentals/{id}/reject` (`ReasonRequest`).
- **Works (mock):** reason radio list (3 presets), optional detail note, confirm/cancel; built on shared Modal (Esc-to-close added in Phase 0).
- **Gaps:**
  1. The chosen reason/note reaches L5's `onConfirm` — which ignores both values and only flips status; the reason therefore never reaches the tenant side (T4 shows a hardcoded reason for every rejection). The data flow exists in props and is dropped at the last step.
  2. Reason presets are UI-only strings; free-text note has no length/required rule (choosing "Lý do khác" with an empty note is allowed).

### L6 — `/landlord/tenants` Tenants & contracts
- **UC:** UC05.1 (manage tenants), UC05.2 (assign room), UC05.3 (contracts), UC05.4 (checkout/settlement).
- **Backend:** `GET /api/tenancies`; `POST /api/tenancies/{id}/confirm-deposit`, `/cancel`, `/end`; settlement `POST …/settlement/preview` + `POST …/settlement`. No standalone assign endpoint (assignment = accept flow, L5).
- **Works (mock):** tenant list with selection; contract summary panel (rent, deposit, unit prices, cycle, status) derived from the selected tenant + room lookup.
- **Gaps:**
  1. **"Phân phòng" button is dead** (UC05.2) — no room picker, no assignment flow at all.
  2. **"Trả phòng / Tất toán" button is dead** (UC05.4) — no settlement preview, no final meter reading, no deposit-refund computation, no room-release; a tenancy can never be ended from the UI.
  3. No deposit confirmation (backend `confirm-deposit` + `depositDeadline` exist; a PENDING tenancy awaiting deposit has no UI state — frontend `Tenant.status` lacks PENDING entirely, and invents `ENDING` instead).
  4. Electricity/water unit prices and "Thanh toán đầu tháng" cycle are hardcoded strings, not the tenancy's `electricityUnitPrice`/`waterUnitPrice`/terms; no contract edit (UC05.3 update side), no add-tenant path, no contract document/terms view (`termsAndConditions` unshown).

### L7 — `/landlord/invoices` Meter readings & invoices (+ B13)
- **UC:** UC05.5 (electricity readings), UC05.6 (water readings), UC05.7 (monthly total computation), UC05.8 (create invoice), UC05.9 (payment tracking), reminders (backend InvoiceReminder).
- **Backend:** `POST /api/invoices` (readings embedded in `CreateInvoiceRequest`); `GET /api/invoices`, `GET /api/invoices/{id}` (derived `overdue`); `/confirm`, `/pay`, `/dispute`, `/resolve-dispute`; corrections sub-resource; `POST /api/invoices/{id}/remind`, `GET /api/invoices/reminders`.
- **Works (mock):** chips filter the invoice list (current month / overdue / unrecorded); meter-reading table (read-only) including one unrecorded room; invoice list opens B13; B13 "Gửi nhắc" fires a toast; featured-invoice card.
- **Gaps:**
  1. **Meter readings cannot be entered** — UC05.5/UC05.6's core action is missing: the table is display-only, Phòng 405 ("chưa ghi") has no input, no old→new validation UI beyond a caption ("Chỉ số mới nhỏ hơn chỉ số cũ sẽ bị chặn" — a rule with no form to apply it to), and water readings are absent entirely (the table is electricity-only despite the page title "Điện – Nước").
  2. **"Tạo hóa đơn tháng 11" only shows a toast** — it creates nothing: no billing-month/due-date form, no per-tenancy creation, no new invoice appears in the list. UC05.8 is a toast, not a function.
  3. **No payment lifecycle actions** — confirm/pay/dispute/resolve-dispute and corrections exist in the backend but B13 offers only "Gửi nhắc"; a PENDING invoice can never become CONFIRMED/PAID from the UI (UC05.9 is read-only badges).
  4. **OVERDUE is modelled as a stored status** (type + chip filter + tones) while the backend derives it from `dueDate` — the mock invoices carry a fake `OVERDUE` status value instead of a past due date.
  5. The featured card is hardwired to `invoices[0]` regardless of chip selection, and invoice items in mock data include the unsupported "Phí dịch vụ" line (see T2/§3.3).

### B13 — Invoice drawer (`InvoiceDrawer.tsx`)
- **UC:** UC05.9 (invoice detail + payment history), UC05.7 (itemised total).
- **Backend:** `GET /api/invoices/{invoiceId}` (`InvoiceDetailResponse` incl. meterReading + outstandingAmount).
- **Works (mock):** itemised lines with folded meter detail ("Điện · 86 số × 3.500đ"), total, payment history list, remind button → toast via L7. Esc-to-close added in Phase 0 (shared Drawer).
- **Gaps:**
  1. Only one action exists ("Gửi nhắc") — no confirm/pay/dispute/correction actions (see L7 gap 3).
  2. No meter-reading block (old/new readings, usage) even though the detail DTO carries `meterReading`; no due date or outstanding amount shown; history lines are relabelled mock strings ("Đã thanh toán" hardcoded into the render) rather than payment events.

### L8 — `/landlord/statistics` Finance statistics
- **UC:** UC05.10 (finance statistics).
- **Backend:** none (no stats endpoint — aggregate from invoices when wired).
- **Works (mock):** KPI row (revenue / collected / uncollected / overdue), monthly bar chart, per-house bars, expense donut.
- **Gaps:**
  1. **No controls at all** — period and house are fixed captions ("Năm 2026 · Tất cả các nhà"); UC05.10's "theo thời gian" (over time) implies a period switcher that doesn't exist.
  2. All numbers are static constants disconnected from L7's invoice data (e.g. "6 hóa đơn mở", "2 hóa đơn quá hạn" are literals), so the page can contradict the invoices screen.
  3. The expense donut relabels data oddly (`EXPENSE_LABELS` maps 'Nước' → 'Bảo trì'), and expense categories have no backend/invoice basis (invoice items are income lines: rent/electricity/water).

### L9 — `/landlord/notifications` Notifications
- **UC:** Receiving end of UC07.7 + system notifications (INTEREST_REQUEST, POST_APPROVAL, INVOICE types); landlord→tenant messaging (no UC code; UC07.7 is admin-scoped — this compose is a landlord extension).
- **Backend:** `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH …/{id}/read`, `PATCH …/read-all`. **No POST** — composing/sending is unbacked (notifications are system-generated via Kafka).
- **Works (mock):** notification list with type dots; compose form appends the message to the local list.
- **Gaps:**
  1. **Compose has no recipient choice** — audience is fixed copy ("Gửi tới: tất cả khách đang thuê"); no per-tenant or per-room targeting, no title field.
  2. **Read state is decorative** — items carry `read` flags that nothing displays (no unread styling/badge) and clicking an item doesn't mark it read; "mark all read" doesn't exist; the HostTopbar bell shows no unread count despite the `unread-count` endpoint.
  3. The composed message is only prepended locally — presented as "sent" with no delivery semantics (and, per backend, no endpoint could send it; this needs a product decision, not just wiring).

### L10 — `/landlord/profile` Profile & Contact Card
- **UC:** UC01.4 (profile view/update), UC02.8 (Contact Card content the tenant receives).
- **Backend:** `GET /api/users/me` — the only profile endpoint; **no update endpoint exists**.
- **Works (mock):** identity card, verification checklist, Contact Card preview as the tenant sees it.
- **Gaps:**
  1. **"Chỉnh sửa" button is dead** — no edit form for name/phone/email (UC01.4's update side unserved; backend also lacks the endpoint, so this is a both-sides gap).
  2. Verification items ("Đã xác minh CCCD"…) are static claims with no state or flow; the landlord-verification lifecycle that Admin approves (A4) is invisible here.
  3. House count is hardcoded ("3 nhà · 36 phòng") and inconsistent with L2's single manageable house.

### L11 — `/landlord/login` Landlord login
- **UC:** UC01.2, UC01.5.
- **Backend:** `POST /api/auth/login`.
- **Works (mock):** submit navigates to `/landlord`; Google button also navigates (mock); show/hide password; host-stats photo panel.
- **Gaps:** same class as T7 — no validation/error states; "Quên mật khẩu?" is an inert span (not even a link); "Đăng ký chủ trọ" is `href="#"` (dead) although T8 register with landlord role exists; Google sign-in is an unsupported function (no backend OAuth) presented as working.

### A1 — `/admin` System dashboard
- **UC:** UC07.8 (system statistics), UC07.5 (vacant rooms system-wide), UC07.4/UC07.6 attention counts.
- **Backend:** no statistics endpoint; vacancy would aggregate `GET /api/admin/users/{id}/properties` per landlord; pending posts from `GET /api/admin/posts`.
- **Works (mock):** KPI row, user-growth bar + line charts, post-status donut, vacant-rooms-by-landlord table (derived arithmetically from mock landlord room counts/occupancy).
- **Gaps:**
  1. **"Cần chú ý" items are dead text** — pending posts / pending reports / pending landlord verifications don't link to A2/A5/A4.
  2. Vacancy is *estimated* (`rooms × (100 − occupancy)`) from a static mock list, not room data; "3 chủ trọ chờ xác minh" is a literal with no corresponding queue anywhere in the admin UI (see A4).
  3. No audit-log surface here (it lives, merged and read-only, on A6n).

### A2 — `/admin/moderation` Moderation queue
- **UC:** UC04.7 (approve), UC04.8 (reject with reason), UC07.4 (content management).
- **Backend:** `GET /api/admin/posts`; `POST /api/admin/posts/{id}/approve`; `POST /api/admin/posts/{id}/reject` (`PostRejectionRequest`).
- **Works (mock):** queue list with selection, preview panel, approve/reject flip `localStatus` and update the pending count, empty-queue state.
- **Gaps:**
  1. **"Từ chối · Kèm lý do" collects no reason** — despite its label, the button rejects immediately; there is no reason input on this screen (UC04.8's defining requirement), unlike the detail screen which has an input it discards (A3d).
  2. Quick-check list ("Ảnh thật, rõ nét"…) is four static green dots — not checks the admin performs or an AI result with a source; it implies verification that never happens.
  3. No takedown of already-APPROVED posts from the queue/list (UC04.9) — decided posts only show a status badge; actions disappear.
  4. Decisions are local state only; the "sẽ được ghi vào nhật ký" audit promise (made on A3d) has no visible effect in A6n's static log.

### A3d — `/admin/moderation/[id]` Moderation detail
- **UC:** UC04.7, UC04.8, UC07.4.
- **Backend:** same AdminPost endpoints; post detail would come from `GET /api/rooms/{roomId}`-side data.
- **Works (mock):** full photo/description/amenities review layout, checklist, "Rủi ro thấp" badge, reject-reason input field, back link.
- **Gaps:**
  1. **Approve/Reject are plain links back to the queue — they change nothing.** This is worse than a dead button: the admin is returned to A2 believing a decision was recorded, but the queue item is still PENDING there (A2 state is independent). The two moderation screens are functionally disconnected.
  2. The reject-reason `Input` is uncontrolled and its value is discarded on navigation (UC04.8 reason never captured even as mock state).
  3. Checklist items are pre-checked static markup; the description is a single hardcoded sample string for every post; landlord name comes from a hardcoded roomId→name map duplicated from A2.
  4. No gỡ/xóa (takedown) action (UC04.9), consistent with the backend gap.

### A4 — `/admin/users` User management
- **UC:** UC07.1 (accounts), UC07.2 (landlords), UC07.3 (tenants), UC01.5 (roles/status).
- **Backend:** `GET /api/admin/users`, `GET /api/admin/users/{id}`, `GET /api/admin/users/{id}/properties`, lock/unlock, **approve-landlord / reject-landlord**.
- **Works (mock):** landlord/tenant tabs, selection, detail card, lock/unlock toggle works locally.
- **Gaps:**
  1. **Landlord verification is entirely missing** — backend has approve/reject-landlord and `UserStatus.PENDING_VERIFICATION`, A1's dashboard claims "3 chủ trọ chờ xác minh", yet this screen has no pending-verification queue, no approve/reject actions, and the frontend `UserAccount` type cannot even represent the status.
  2. Lock/unlock fires instantly with **no confirmation dialog** — a destructive, audit-worthy action (Phase 0 added a shared `ConfirmDialog` for exactly this class of action).
  3. Detail panel is thin vs backend: no properties list for landlords (`/{id}/properties`), no contact fields shown (email/phone are in the data but unused), no search/filter over the account list, and the "bị khóa sau 2 báo cáo" explanation is a hardcoded string shown for every locked user.

### A5 — `/admin/reports` Violation reports
- **UC:** UC07.6 (manage reports), UC04.9 (takedown resulting from a report).
- **Backend:** **NONE — UC07.6 has no backend module** (verified: no entity/controller/DTO). This whole screen is frontend-only until the backend is built.
- **Works (mock):** list + detail, "Gỡ bài đăng" and "Đóng báo cáo · Không vi phạm" update the report's status locally.
- **Gaps:**
  1. **"Gỡ bài đăng" is mislabelled** — the handler only marks the *report* RESOLVED; no post is removed or hidden anywhere (the reported post stays APPROVED in A2/L3 data). The button promises UC04.9 and performs bookkeeping.
  2. No link from a report to the reported post/room detail (the room code is parsed out of the target string with a regex for display only), no reporter/target profile links, no status filter, no assignment/priority.
  3. Report statuses (PENDING/RESOLVED/DISMISSED) are frontend inventions with no backend enum to align to — flag for the backend team when UC07.6 is built.

### A6n — `/admin/notifications` Broadcast + audit log
- **UC:** UC07.7 (admin notifications: create + send to all/landlords/tenants), UC07.9 (audit log).
- **Backend:** notifications — **no create/broadcast endpoint** (read/mark-read only, §2.5); audit log — **no read endpoint** (§2.6). Both halves of this screen are currently unbacked.
- **Works (mock):** compose form (title/body/audience chips) with a transient "Đã gửi" confirmation; audit log list rendered from mock data.
- **Gaps:**
  1. The broadcast "send" only clears the form and flashes a success line — no sent-history list is kept (the admin cannot see what was broadcast, to whom, or when), and no toast/undo pattern is used.
  2. Audit log is read-only and minimal: no filter by actor/action/date, no search, no pagination, timestamps are truncated for display (`timePartOf` drops the date), and entries are static mock rows that never gain the actions taken in A2/A4/A5 during the same session.
  3. `notificationsAdmin` mock data exists but is unused here — the admin's *own* received notifications have no surface (this screen is compose-only).

### A7 — `/admin/login` Admin login + face auth
- **UC:** UC01.2 (admin login), UC01.6 (AI face verification / anomalous-login detection).
- **Backend:** `POST /api/auth/login`; face-auth-service — **no endpoints exist** (§2.11).
- **Works (mock):** split card (form | face panel with camera frame, scan line, step indicator, "Rủi ro thấp" badge); "Tiếp tục · Xác thực khuôn mặt" navigates to `/admin`.
- **Gaps:**
  1. **The button skips both steps it names** — credentials are never checked (empty fields work) and no face scan starts; the two-step indicator (1 Đăng nhập → 2 Quét khuôn mặt) is never traversed. There are no scanning / success / failure / retry states.
  2. The face panel is a static illustration (placeholder silhouette + fixed scan line + permanently "Rủi ro thấp" badge) — the risk verdict is asserted before any verification, which inverts UC01.6's purpose.
  3. No fallback path (face fails → password-only lockout / manual review) and no anomalous-login handling, the UC's core scenario.

---

## 5. Cross-cutting findings

### 5.1 UI functions supported by neither UC nor backend (remove or re-justify)
| Where | Function | Problem |
|---|---|---|
| T2, L7, B13 | "Phí dịch vụ" invoice line | `InvoiceItemType` = ROOM_RENT/ELECTRICITY/WATER only; totals built on it are unreproducible |
| T7, T8, L11 | "Tiếp tục với Google" | No OAuth in UC or backend (dead on T7/T8) |
| T1, T2 | Star ratings | No rating data anywhere in backend |
| L3 | Post view counts | No view tracking in backend DTOs |
| T4 | "Mô phỏng: chủ trọ chấp nhận" | Dev simulation exposed as a user action |
| L9 compose, A6n broadcast | Sending notifications | No POST endpoint exists; sending is currently faked locally |
| A5 (whole screen) | Violation reports | UC requires it, backend module does not exist — backend work needed, UI is ahead |

### 5.2 Backend functions with no UI surface
| Backend function | Endpoint | Missing UI |
|---|---|---|
| Cancel own request | `POST /api/rentals/{id}/cancel` | T4 has no cancel |
| Confirm deposit | `POST /api/tenancies/{id}/confirm-deposit` | L6 |
| Settlement preview/complete | `…/settlement/preview`, `…/settlement` | L6 checkout flow |
| Invoice confirm/pay/dispute/resolve | `/api/invoices/{id}/…` | B13/L7 actions |
| Invoice corrections | `/api/invoices/{id}/corrections` | L7/B13 |
| Invoice reminders list | `GET /api/invoices/reminders` | L7 |
| Approve/reject landlord | `/api/admin/users/{id}/approve-landlord` | A4 verification queue |
| Landlord properties (admin view) | `GET /api/admin/users/{id}/properties` | A4 detail |
| Mark notifications read / unread count | `PATCH /api/notifications/…` | L9, tenant header, topbar bells |
| Pricing prediction | `POST /api/v1/pricing/predict` | L4 uses hardcoded numbers |
| Chat follow-ups & sources | `ChatResponse.suggested_follow_ups / source_documents` | A3 |

### 5.3 Backend gaps to raise with the backend team (UC requires, backend missing)
1. UC03.1/UC03.2 — House/Floor CRUD endpoints (entities exist; room creation requires their IDs).
2. UC04.4 — DELETE post/room endpoint. UC04.9 — admin takedown endpoint.
3. UC01.4 — profile update endpoint (`GET /me` only). UC01.3 — logout (client-side only today).
4. UC07.6 — violation-report module (entirely absent). UC07.7 — notification create/broadcast endpoint. UC07.8/UC05.10 — statistics endpoints. UC07.9 — audit-log read endpoint.
5. UC01.6 — face-auth-service is an empty shell (no endpoints at all).
6. Forgot-password flow (UI links exist on T7/L11; no endpoint, no UC requirement — decide).

### 5.4 Top 10 functional gaps across screens
| # | Screen | Gap |
|---|---|---|
| 1 | T2 room detail | "Gửi yêu cầu quan tâm" (UC02.6 — the core tenant action) is a dead button; requests cannot be created anywhere |
| 2 | A6 + T1 | Filter modal never applies its selections to the result list; the result count is hardcoded (UC02.2) |
| 3 | A3d moderation detail | Approve/Reject are links that record nothing — decisions evaporate between the two moderation screens (UC04.7/04.8) |
| 4 | L7 invoices | Meter readings cannot be entered and "Tạo hóa đơn" only toasts — UC05.5/05.6/05.8 have no working UI |
| 5 | L5 requests | Accept creates no contract terms and no tenancy downstream (UC02.7 → UC05.3 hand-off missing) |
| 6 | L3 listings | Post rows have no actions at all: edit / hide / submit / delete (UC04.3–04.6) unserved |
| 7 | L6 tenants | "Phân phòng" and "Trả phòng / Tất toán" are dead buttons (UC05.2, UC05.4 + settlement) |
| 8 | L2 rooms | No add/edit house, floor or room; status changes are an unguarded blind cycle (UC03.1–03.5) |
| 9 | A4 users | Landlord verification (approve/reject, PENDING_VERIFICATION) missing despite backend endpoints (UC07.2) |
| 10 | A7 admin login | Face-auth is a static illustration; the login button skips both credential check and scan (UC01.6) |

### 5.5 Shared infrastructure added in Phase 0 (for flow builders)
- `src/components/ui/Toast.tsx` — `push(title, body?, action?)` now supports an optional
  action button (e.g. `{ label: 'Hoàn tác', onClick }`); action toasts stay 6s (plain: 3.5s)
  and dismiss when the action is clicked. `ToastProvider` is now mounted in all three
  flows (TenantShell, landlord layout, admin layout) — previously `useToast()` silently
  no-opped outside `/landlord`. Auth pages (login/register) remain outside any provider.
- `src/components/ui/ConfirmDialog.tsx` — **new**: reusable confirm dialog on the shared
  Modal (`open, title, description, confirmLabel, danger?, onConfirm, onCancel`), for
  destructive actions (lock account, delete, takedown…). Esc/backdrop = cancel.
- `src/components/ui/Modal.tsx` / `Drawer.tsx` — Esc-to-close added once in the shared
  components (covers FilterModal, RejectModal, InvoiceDrawer, ConfirmDialog);
  `AiPanel` (a shared panel not built on Modal/Drawer) got the same Esc handling.
- `src/styles/globals.css` — global `:focus-visible` ring (2px, primary indigo token)
  for keyboard users; component-level focus styles are unaffected.
- `src/services/api.ts` — unchanged: still the mock seam; no real backend calls wired.
