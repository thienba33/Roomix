import type {
  Room, Post, RentalRequestItem, Tenant, Invoice, NotificationItem,
  UserAccount, ReportItem, AuditEntry, ActivityItem,
} from '@/types';

export const house = {
  name: 'Roomix Lê Văn Lương',
  address: 'Lê Văn Lương, Thanh Xuân, Hà Nội',
  totalRooms: 36,
};

export const landlord = {
  name: 'Nguyễn Văn An',
  initials: 'An',
  email: 'an.nguyen@roomix.vn',
  phone: '0912 345 678',
  house: 'Roomix Lê Văn Lương',
  address: 'Lê Văn Lương, Thanh Xuân, Hà Nội',
  joinedAt: '03/2024',
};

export const tenantUser = {
  name: 'Trần Minh Anh',
  email: 'minh.anh@email.com',
  phone: '0901 234 567',
  initials: 'MA',
};

export const adminUser = { name: 'Quản trị viên', initials: 'AD', email: 'admin@roomix.vn' };

const AMEN = ['Điều hòa', 'Wifi', 'Máy giặt', 'Ban công', 'Bếp', 'WC riêng', 'Nóng lạnh', 'Tủ lạnh'];

export const rooms: Room[] = [
  { id: 302, code: '302', name: 'Phòng 302 — Lê Văn Lương', house: 'Roomix Lê Văn Lương', area: 'Thanh Xuân', price: 2800000, size: 25, floor: 3, status: 'AVAILABLE', rating: 4.8, image: '/images/rooms/room-302-a.jpg', gallery: ['/images/rooms/room-302-a.jpg', '/images/rooms/room-302-b.jpg', '/images/rooms/room-201.jpg'], amenities: AMEN },
  { id: 405, code: '405', name: 'Phòng 405 — Cầu Giấy', house: 'Roomix Cầu Giấy', area: 'Cầu Giấy', price: 3200000, size: 28, floor: 4, status: 'AVAILABLE', rating: 4.9, image: '/images/rooms/room-405.webp', gallery: ['/images/rooms/room-405.webp', '/images/rooms/room-302-a.jpg'], amenities: AMEN },
  { id: 201, code: '201', name: 'Phòng 201 — Đống Đa', house: 'Roomix Đống Đa', area: 'Đống Đa', price: 2500000, size: 22, floor: 2, status: 'RESERVED', rating: 4.7, image: '/images/rooms/room-201.jpg', gallery: ['/images/rooms/room-201.jpg'], amenities: ['Điều hòa', 'Wifi', 'WC riêng', 'Nóng lạnh'] },
  { id: 510, code: '510', name: 'Phòng 510 — Hà Đông', house: 'Roomix Hà Đông', area: 'Hà Đông', price: 2200000, size: 20, floor: 5, status: 'AVAILABLE', rating: 4.8, image: '/images/rooms/room-510.jpg', gallery: ['/images/rooms/room-510.jpg'], amenities: ['Điều hòa', 'Wifi', 'Máy giặt', 'Bếp'] },
  { id: 102, code: '102', name: 'Phòng 102 — Cầu Giấy', house: 'Roomix Cầu Giấy', area: 'Cầu Giấy', price: 3600000, size: 32, floor: 1, status: 'AVAILABLE', rating: 4.9, image: '/images/rooms/room-102.webp', gallery: ['/images/rooms/room-102.webp', '/images/rooms/room-405.webp'], amenities: AMEN },
  { id: 303, code: '303', name: 'Phòng 303 — Thanh Xuân', house: 'Roomix Lê Văn Lương', area: 'Thanh Xuân', price: 2900000, size: 26, floor: 3, status: 'MAINTENANCE', rating: 4.7, image: '/images/rooms/room-303.jpg', gallery: ['/images/rooms/room-303.jpg'], amenities: ['Điều hòa', 'Wifi', 'Ban công', 'WC riêng'] },
];

export const favoriteRooms: Room[] = [rooms[1], rooms[3]];

export const stats = { totalRooms: 36, rented: 29, empty: 5, occupancy: 82, revenueMonth: 84500000 };

export const revenueBar = [
  { label: 'T5', m: 'T5', value: 62, v: 62 },
  { label: 'T6', m: 'T6', value: 70, v: 70 },
  { label: 'T7', m: 'T7', value: 66, v: 66 },
  { label: 'T8', m: 'T8', value: 78, v: 78 },
  { label: 'T9', m: 'T9', value: 84, v: 84 },
  { label: 'T10', m: 'T10', value: 92, v: 92 },
];

export const revenueLine = [
  { label: 'T1', m: 'T1', value: 18.2, v: 18.2 },
  { label: 'T2', m: 'T2', value: 19.5, v: 19.5 },
  { label: 'T3', m: 'T3', value: 21.3, v: 21.3 },
  { label: 'T4', m: 'T4', value: 20.6, v: 20.6 },
  { label: 'T5', m: 'T5', value: 22.8, v: 22.8 },
  { label: 'T6', m: 'T6', value: 24.6, v: 24.6 },
];

export const userGrowth = [
  { label: 'T5', m: 'T5', value: 42, v: 42 },
  { label: 'T6', m: 'T6', value: 55, v: 55 },
  { label: 'T7', m: 'T7', value: 61, v: 61 },
  { label: 'T8', m: 'T8', value: 74, v: 74 },
  { label: 'T9', m: 'T9', value: 86, v: 86 },
  { label: 'T10', m: 'T10', value: 97, v: 97 },
];

export const expenseDonut = [
  { label: 'Điện', value: 45, color: '#4F46E5' },
  { label: 'Nước', value: 25, color: '#0EA5E9' },
  { label: 'Khác', value: 30, color: '#DDDDDD' },
];

export const postDonut = [
  { label: 'Đã duyệt', value: 68, color: '#16A34A' },
  { label: 'Chờ duyệt', value: 22, color: '#F59E0B' },
  { label: 'Từ chối', value: 10, color: '#DC2626' },
];

export const occupancyDonut = [
  { label: 'Đang thuê', value: 82, color: '#4F46E5' },
  { label: 'Còn lại', value: 18, color: '#E5E7EB' },
];

export const posts: Post[] = [
  { id: 1, roomId: 302, roomCode: '302', title: 'Phòng 302 — Lê Văn Lương', status: 'APPROVED', createdAt: '28/09/2026', views: 342, image: '/images/rooms/room-302-a.jpg', price: 2800000, area: 'Thanh Xuân' },
  { id: 2, roomId: 405, roomCode: '405', title: 'Phòng 405 — Cầu Giấy', status: 'APPROVED', createdAt: '30/09/2026', views: 518, image: '/images/rooms/room-405.webp', price: 3200000, area: 'Cầu Giấy' },
  { id: 3, roomId: 510, roomCode: '510', title: 'Phòng 510 — Hà Đông', status: 'PENDING', createdAt: '12/10/2026', views: 0, image: '/images/rooms/room-510.jpg', price: 2200000, area: 'Hà Đông' },
  { id: 4, roomId: 201, roomCode: '201', title: 'Phòng 201 — Đống Đa', status: 'DRAFT', createdAt: '10/10/2026', views: 0, image: '/images/rooms/room-201.jpg', price: 2500000, area: 'Đống Đa' },
  { id: 5, roomId: 303, roomCode: '303', title: 'Phòng 303 — Thanh Xuân', status: 'REJECTED', createdAt: '05/10/2026', updatedAt: '06/10/2026', views: 12, image: '/images/rooms/room-303.jpg', price: 2900000, area: 'Thanh Xuân' },
  { id: 6, roomId: 102, roomCode: '102', title: 'Phòng 102 — Cầu Giấy', status: 'HIDDEN', createdAt: '20/09/2026', views: 890, image: '/images/rooms/room-102.webp', price: 3600000, area: 'Cầu Giấy' },
];

export const moderationQueue: Post[] = [
  { id: 11, roomId: 510, roomCode: '510', title: 'Phòng 510 — Hà Đông, gần bến xe', status: 'PENDING', createdAt: '18/10/2026', views: 0, image: '/images/rooms/room-510.jpg', price: 2200000, area: 'Hà Đông' },
  { id: 12, roomId: 102, roomCode: '102', title: 'Phòng 102 — Cầu Giấy, full nội thất', status: 'PENDING', createdAt: '17/10/2026', views: 0, image: '/images/rooms/room-102.webp', price: 3600000, area: 'Cầu Giấy' },
  { id: 13, roomId: 405, roomCode: '405', title: 'Phòng 405 — Cầu Giấy', status: 'PENDING', createdAt: '16/10/2026', views: 0, image: '/images/rooms/room-405.webp', price: 3200000, area: 'Cầu Giấy' },
  { id: 14, roomId: 303, roomCode: '303', title: 'Phòng 303 — Thanh Xuân', status: 'PENDING', createdAt: '15/10/2026', views: 0, image: '/images/rooms/room-303.jpg', price: 2900000, area: 'Thanh Xuân' },
];

export const requests: RentalRequestItem[] = [
  { id: 1, room: 'Phòng 302', roomId: 302, tenant: 'Trần Minh Anh', initials: 'MA', date: '18/10/2026', message: 'Em muốn thuê từ đầu tháng 11, ở 2 người. Phòng còn trống không anh?', status: 'PENDING', phone: '0901 234 567', email: 'minh.anh@email.com' },
  { id: 2, room: 'Phòng 405', roomId: 405, tenant: 'Lê Hoàng Nam', initials: 'LN', date: '17/10/2026', message: 'Cho em hỏi giá điện nước và có chỗ để xe không ạ?', status: 'PENDING' },
  { id: 3, room: 'Phòng 302', roomId: 302, tenant: 'Phạm Thu Hằng', initials: 'PH', date: '15/10/2026', message: 'Em đã xem phòng, muốn đặt cọc luôn tuần này.', status: 'ACCEPTED', phone: '0987 654 321', email: 'thu.hang@email.com' },
  { id: 4, room: 'Phòng 510', roomId: 510, tenant: 'Vũ Đức Anh', initials: 'VA', date: '12/10/2026', message: 'Em cần phòng gấp, có thể dọn vào ngay không?', status: 'REJECTED' },
];

export const tenancies: Tenant[] = [
  { id: 1, name: 'Trần Minh Anh', initials: 'MA', room: 'Phòng 302', phone: '0901 234 567', email: 'minh.anh@email.com', startDate: '01/10/2026', endDate: '30/09/2027', deposit: 2800000, status: 'ACTIVE' },
  { id: 2, name: 'Lê Hoàng Nam', initials: 'LN', room: 'Phòng 405', phone: '0913 222 111', email: 'hoang.nam@email.com', startDate: '15/09/2026', endDate: '14/09/2027', deposit: 3200000, status: 'ACTIVE' },
  { id: 3, name: 'Phạm Thu Hằng', initials: 'PH', room: 'Phòng 308', phone: '0987 654 321', email: 'thu.hang@email.com', startDate: '01/08/2026', endDate: '31/10/2026', deposit: 2600000, status: 'ENDING' },
  { id: 4, name: 'Nguyễn Văn Đức', initials: 'ND', room: 'Phòng 201', phone: '0905 888 777', email: 'van.duc@email.com', startDate: '01/06/2026', endDate: '31/05/2027', deposit: 2500000, status: 'ACTIVE' },
];

export const invoices: Invoice[] = [
  {
    id: 1, code: 'HD-302-10', room: 'Phòng 302', tenant: 'Trần Minh Anh', period: 'Tháng 10/2026', dueDate: '05/11/2026', status: 'PENDING',
    items: [
      { label: 'Tiền phòng', detail: 'Tháng 10/2026', amount: 2800000 },
      { label: 'Tiền điện', detail: '86 số × 3.500đ', amount: 301000 },
      { label: 'Tiền nước', detail: '9 khối × 12.000đ', amount: 108000 },
      { label: 'Phí dịch vụ', detail: 'Vệ sinh, thang máy, rác', amount: 141000 },
    ],
    total: 3350000,
    history: [
      { date: '05/10/2026', label: 'Hóa đơn tháng 9', amount: 3280000 },
      { date: '04/09/2026', label: 'Hóa đơn tháng 8', amount: 3310000 },
    ],
  },
  {
    id: 2, code: 'HD-405-10', room: 'Phòng 405', tenant: 'Lê Hoàng Nam', period: 'Tháng 10/2026', dueDate: '05/11/2026', status: 'PENDING',
    items: [
      { label: 'Tiền phòng', detail: 'Tháng 10/2026', amount: 3200000 },
      { label: 'Tiền điện', detail: '72 số × 3.500đ', amount: 252000 },
      { label: 'Tiền nước', detail: '7 khối × 12.000đ', amount: 84000 },
      { label: 'Phí dịch vụ', detail: 'Vệ sinh, thang máy, rác', amount: 120000 },
    ],
    total: 3656000,
    history: [{ date: '03/10/2026', label: 'Hóa đơn tháng 9', amount: 3590000 }],
  },
  {
    id: 3, code: 'HD-308-09', room: 'Phòng 308', tenant: 'Phạm Thu Hằng', period: 'Tháng 9/2026', dueDate: '05/10/2026', status: 'OVERDUE',
    items: [
      { label: 'Tiền phòng', detail: 'Tháng 9/2026', amount: 2600000 },
      { label: 'Tiền điện', detail: '95 số × 3.500đ', amount: 332500 },
      { label: 'Tiền nước', detail: '10 khối × 12.000đ', amount: 120000 },
      { label: 'Phí dịch vụ', detail: 'Vệ sinh, thang máy, rác', amount: 100000 },
    ],
    total: 3152500,
    history: [{ date: '05/09/2026', label: 'Hóa đơn tháng 8', amount: 3080000 }],
  },
  {
    id: 4, code: 'HD-201-10', room: 'Phòng 201', tenant: 'Nguyễn Văn Đức', period: 'Tháng 10/2026', dueDate: '05/11/2026', status: 'PAID',
    items: [
      { label: 'Tiền phòng', detail: 'Tháng 10/2026', amount: 2500000 },
      { label: 'Tiền điện', detail: '60 số × 3.500đ', amount: 210000 },
      { label: 'Tiền nước', detail: '6 khối × 12.000đ', amount: 72000 },
      { label: 'Phí dịch vụ', detail: 'Vệ sinh, thang máy, rác', amount: 100000 },
    ],
    total: 2882000,
    history: [{ date: '18/10/2026', label: 'Thanh toán tháng 10', amount: 2882000 }],
  },
];

export const notificationsLandlord: NotificationItem[] = [
  { id: 1, type: 'INTEREST_REQUEST', title: 'Yêu cầu quan tâm mới', body: 'Trần Minh Anh quan tâm Phòng 302', time: '10 phút trước', read: false },
  { id: 2, type: 'INVOICE', title: 'Hóa đơn quá hạn', body: 'Phòng 308 — hóa đơn tháng 9 chưa thanh toán', time: '1 giờ trước', read: false },
  { id: 3, type: 'POST_APPROVAL', title: 'Bài đăng được duyệt', body: 'Bài đăng Phòng 405 đã được Admin duyệt', time: 'Hôm qua', read: true },
  { id: 4, type: 'SYSTEM', title: 'Nhắc ghi chỉ số điện', body: 'Đã đến kỳ ghi chỉ số điện nước tháng 10', time: '2 ngày trước', read: true },
];

export const notificationsTenant: NotificationItem[] = [
  { id: 1, type: 'INVOICE', title: 'Hóa đơn tháng 10', body: 'Hóa đơn Phòng 302: 3.350.000đ, hạn 05/11', time: 'Hôm nay', read: false },
  { id: 2, type: 'GENERAL', title: 'Yêu cầu được chấp nhận', body: 'Chủ trọ đã mở Contact Card cho Phòng 302', time: 'Hôm qua', read: true },
];

export const notificationsAdmin: NotificationItem[] = [
  { id: 1, type: 'POST_APPROVAL', title: '4 bài đăng chờ duyệt', body: 'Hàng chờ kiểm duyệt đang có 4 bài', time: '30 phút trước', read: false },
  { id: 2, type: 'GENERAL', title: 'Báo cáo vi phạm mới', body: '1 báo cáo về bài đăng sai thông tin', time: '2 giờ trước', read: false },
  { id: 3, type: 'SYSTEM', title: 'Sao lưu hệ thống hoàn tất', body: 'Sao lưu dữ liệu định kỳ thành công', time: 'Hôm qua', read: true },
];

export const usersAdminLandlords: UserAccount[] = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@roomix.vn', phone: '0912 345 678', role: 'LANDLORD', status: 'ACTIVE', joinedAt: '03/2024', house: 'Roomix Lê Văn Lương', rooms: 36 },
  { id: 2, name: 'Trần Thị Mai', email: 'mai.tran@roomix.vn', phone: '0909 111 222', role: 'LANDLORD', status: 'ACTIVE', joinedAt: '05/2024', house: 'Roomix Cầu Giấy', rooms: 24 },
  { id: 3, name: 'Lê Văn Hùng', email: 'hung.le@roomix.vn', phone: '0918 333 444', role: 'LANDLORD', status: 'LOCKED', joinedAt: '01/2025', house: 'Roomix Hà Đông', rooms: 18 },
];

export const usersAdminTenants: UserAccount[] = [
  { id: 11, name: 'Trần Minh Anh', email: 'minh.anh@email.com', phone: '0901 234 567', role: 'TENANT', status: 'ACTIVE', joinedAt: '09/2026' },
  { id: 12, name: 'Lê Hoàng Nam', email: 'hoang.nam@email.com', phone: '0913 222 111', role: 'TENANT', status: 'ACTIVE', joinedAt: '09/2026' },
  { id: 13, name: 'Phạm Thu Hằng', email: 'thu.hang@email.com', phone: '0987 654 321', role: 'TENANT', status: 'ACTIVE', joinedAt: '08/2026' },
  { id: 14, name: 'Vũ Đức Anh', email: 'duc.anh@email.com', phone: '0903 555 666', role: 'TENANT', status: 'LOCKED', joinedAt: '07/2026' },
];

export const usersAdmin: UserAccount[] = [...usersAdminLandlords, ...usersAdminTenants];

export const adminLandlords = [
  { id: 1, name: 'Nguyễn Văn An', house: 'Roomix Lê Văn Lương', rooms: 36, occupancy: 82, revenue: 84500000 },
  { id: 2, name: 'Trần Thị Mai', house: 'Roomix Cầu Giấy', rooms: 24, occupancy: 75, revenue: 56200000 },
  { id: 3, name: 'Lê Văn Hùng', house: 'Roomix Hà Đông', rooms: 18, occupancy: 61, revenue: 34800000 },
  { id: 4, name: 'Phạm Văn Tú', house: 'Roomix Đống Đa', rooms: 12, occupancy: 92, revenue: 28900000 },
];

export const reports: ReportItem[] = [
  { id: 1, reporter: 'Vũ Đức Anh', target: 'Bài đăng Phòng 303', reason: 'Sai thông tin giá', date: '17/10/2026', status: 'PENDING', detail: 'Giá đăng 2,9tr nhưng chủ trọ báo 3,2tr khi liên hệ.' },
  { id: 2, reporter: 'Trần Minh Anh', target: 'Bài đăng Phòng 510', reason: 'Ảnh không đúng thực tế', date: '15/10/2026', status: 'PENDING' },
  { id: 3, reporter: 'Lê Hoàng Nam', target: 'Người dùng Phạm Thu Hằng', reason: 'Spam tin nhắn', date: '10/10/2026', status: 'RESOLVED' },
  { id: 4, reporter: 'Nguyễn Văn Đức', target: 'Bài đăng Phòng 201', reason: 'Phòng đã cho thuê nhưng vẫn hiển thị trống', date: '08/10/2026', status: 'DISMISSED' },
];

export const auditLog: AuditEntry[] = [
  { id: 1, actor: 'Admin', action: 'Duyệt bài đăng', target: 'Phòng 405', time: '18/10/2026 09:12', ip: '192.168.1.10' },
  { id: 2, actor: 'Admin', action: 'Khóa tài khoản', target: 'hung.le@roomix.vn', time: '17/10/2026 15:40' },
  { id: 3, actor: 'Nguyễn Văn An', action: 'Tạo hóa đơn', target: 'Phòng 302 — Tháng 10', time: '17/10/2026 10:05' },
  { id: 4, actor: 'Admin', action: 'Từ chối bài đăng', target: 'Phòng 303', time: '16/10/2026 14:22' },
  { id: 5, actor: 'Hệ thống', action: 'Sao lưu dữ liệu', target: 'Toàn hệ thống', time: '16/10/2026 02:00' },
  { id: 6, actor: 'Admin', action: 'Xử lý báo cáo', target: 'Báo cáo #3', time: '15/10/2026 11:30' },
];

export const activities: ActivityItem[] = [
  { id: 1, room: 'Phòng 302', text: 'Trần Minh Anh bắt đầu thuê', date: '01/10/2026', statusLabel: 'Đang thuê', tone: 'green' },
  { id: 2, room: 'Phòng 405', text: 'Bài đăng được duyệt', date: '30/09/2026', statusLabel: 'Đã duyệt', tone: 'green' },
  { id: 3, room: 'Phòng 308', text: 'Hóa đơn tháng 9 quá hạn', date: '28/09/2026', statusLabel: 'Quá hạn', tone: 'red' },
];

export const adminStats = { totalUsers: 248, totalLandlords: 32, totalPosts: 186, pendingPosts: 4, revenuePlatform: 204400000 };

const landlordRoomImages = [
  '/images/rooms/room-302-a.jpg',
  '/images/rooms/room-405.webp',
  '/images/rooms/room-201.jpg',
  '/images/rooms/room-510.jpg',
  '/images/rooms/room-102.webp',
  '/images/rooms/room-303.jpg',
  '/images/rooms/room-302-b.jpg',
];

const landlordPriceCycle = [2400000, 2600000, 2800000, 2500000, 2900000, 2700000, 3000000, 2300000, 3200000];
const landlordSizeCycle = [20, 24, 28, 22, 26, 30, 21, 25, 32];

function makeLandlordRoom(floor: number, position: number, status: Room['status'], price: number, size: number, note?: string): Room {
  const code = `${floor}${String(position + 1).padStart(2, '0')}`;
  const globalIndex = (floor - 1) * 9 + position;
  const image = landlordRoomImages[globalIndex % landlordRoomImages.length];
  return {
    id: Number(code),
    code,
    name: `Phòng ${code} — Lê Văn Lương`,
    house: 'Roomix Lê Văn Lương',
    area: 'Thanh Xuân',
    price,
    size,
    floor,
    status,
    rating: 4.7,
    image,
    gallery: [image],
    amenities: AMEN,
    ...(note ? { note } : {}),
  };
}

function buildLandlordFloor(floor: 1 | 2 | 4): Room[] {
  return Array.from({ length: 9 }, (_, position) => {
    const code = `${floor}${String(position + 1).padStart(2, '0')}`;
    let status: Room['status'] = 'OCCUPIED';
    if ((floor === 1 && code === '105') || (floor === 2 && code === '205')) {
      status = 'AVAILABLE';
    }
    return makeLandlordRoom(floor, position, status, landlordPriceCycle[position], landlordSizeCycle[position]);
  });
}

const landlordFloor3: Room[] = [
  makeLandlordRoom(3, 0, 'AVAILABLE', 2600000, 22),
  makeLandlordRoom(3, 1, 'OCCUPIED', 2800000, 25),
  makeLandlordRoom(3, 2, 'AVAILABLE', 2900000, 26),
  makeLandlordRoom(3, 3, 'RESERVED', 3000000, 27),
  makeLandlordRoom(3, 4, 'OCCUPIED', 2700000, 24),
  makeLandlordRoom(3, 5, 'MAINTENANCE', 2700000, 24, 'Sửa điện nước, dự kiến xong 25/10'),
  makeLandlordRoom(3, 6, 'AVAILABLE', 2600000, 23),
  makeLandlordRoom(3, 7, 'OCCUPIED', 3100000, 28),
  makeLandlordRoom(3, 8, 'OCCUPIED', 2800000, 25),
];

export const landlordRooms: Room[] = [
  ...buildLandlordFloor(1),
  ...buildLandlordFloor(2),
  ...landlordFloor3,
  ...buildLandlordFloor(4),
].sort((a, b) => a.id - b.id);
