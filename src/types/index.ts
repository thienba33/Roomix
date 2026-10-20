export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface Room {
  id: number;
  code: string;
  name: string;
  house: string;
  area: string;
  price: number;
  size: number;
  floor: number;
  status: RoomStatus;
  rating: number;
  image: string;
  gallery?: string[];
  amenities: string[];
}

export type PostStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';

export interface Post {
  id: number;
  roomId: number;
  roomCode: string;
  title: string;
  status: PostStatus;
  createdAt: string;
  updatedAt?: string;
  views: number;
  image: string;
  price: number;
  area: string;
}

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface RentalRequestItem {
  id: number;
  room: string;
  roomId?: number;
  tenant: string;
  avatar?: string;
  initials?: string;
  date: string;
  message: string;
  status: RequestStatus;
  phone?: string;
  email?: string;
}

export interface Tenant {
  id: number;
  name: string;
  room: string;
  phone: string;
  email: string;
  startDate: string;
  endDate?: string;
  deposit: number;
  status: 'ACTIVE' | 'ENDING' | 'ENDED';
  initials?: string;
}

export type Tenancy = Tenant;

export interface InvoiceItem {
  label: string;
  detail: string;
  amount: number;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CONFIRMED';

export interface Invoice {
  id: number;
  code?: string;
  room: string;
  tenant: string;
  period: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  total: number;
  history: { date: string; label: string; amount: number }[];
}

export type NotificationType = 'SYSTEM' | 'INVOICE' | 'POST_APPROVAL' | 'INTEREST_REQUEST' | 'GENERAL';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'LANDLORD' | 'TENANT';
  status: 'ACTIVE' | 'LOCKED';
  joinedAt: string;
  house?: string;
  rooms?: number;
}

export interface ReportItem {
  id: number;
  reporter: string;
  target: string;
  reason: string;
  date: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  detail?: string;
}

export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  target: string;
  time: string;
  ip?: string;
}

export interface ChartPoint {
  label: string;
  m?: string;
  value: number;
  v?: number;
  color?: string;
}

export interface ActivityItem {
  id: number;
  room: string;
  text: string;
  date: string;
  statusLabel: string;
  tone: 'green' | 'red' | 'amber' | 'indigo';
}
