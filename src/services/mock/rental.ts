import { readMockSession } from './auth';
import { readCatalog, CATALOG_EVENT } from './rooms';
export const RENTAL_KEY = 'roomix_mock_rental_v1';
export const RENTAL_EVENT = 'roomix:mock:rental';
export interface RentalRequest {
  id: string; roomId: string; postId: string; tenantId: string; landlordId: string;
  note: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'; rejectReason?: string;
  createdAt: string; updatedAt: string;
}
export interface ContractTerms {
  startDate: string; endDate: string; monthlyRent: number; depositAmount: number;
  electricityUnitPrice: number; waterUnitPrice: number; initialElectricity: number; initialWater: number;
  termsAndConditions: string; depositDeadline?: string;
}
export interface Tenancy extends ContractTerms {
  id: string; contractCode: string; rentalRequestId: string; roomId: string; tenantId: string; landlordId: string;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'ENDED'; depositDeadline: string;
  cancellationReason?: string; depositConfirmedAt?: string; createdAt: string; updatedAt: string;
}
export interface RentalState { requests: RentalRequest[]; tenancies: Tenancy[]; }
export function todayVN(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function readRental(now = Date.now()): RentalState {
  if (typeof window === 'undefined') return { requests: [], tenancies: [] };
  const state: RentalState = JSON.parse(localStorage.getItem(RENTAL_KEY) || '{"requests":[],"tenancies":[]}');
  if (!Array.isArray(state.requests) || !Array.isArray(state.tenancies)) throw new Error('Không thể đọc dữ liệu thuê phòng.');
  return { ...state, tenancies: state.tenancies.map((t) => t.status === 'PENDING' && Date.parse(t.depositDeadline) <= now ? { ...t, status: 'CANCELLED', cancellationReason: 'Quá hạn xác nhận tiền cọc' } : t) };
}
function actor(role?: 'TENANT' | 'LANDLORD') {
  const user = readMockSession()?.user;
  if (!user || !['TENANT', 'LANDLORD'].includes(user.role) || role && user.role !== role) throw new Error('Vui lòng đăng nhập bằng tài khoản có quyền thực hiện thao tác.');
  return user;
}
export function visibleRental(): RentalState {
  const user = actor(); const state = readRental();
  return { requests: state.requests.filter((r) => r.tenantId === user.id || r.landlordId === user.id), tenancies: state.tenancies.filter((t) => t.tenantId === user.id || t.landlordId === user.id) };
}
function save(state: RentalState) {
  try { localStorage.setItem(RENTAL_KEY, JSON.stringify(state)); }
  catch { throw new Error('Không thể lưu thay đổi. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
  window.dispatchEvent(new Event(RENTAL_EVENT)); window.dispatchEvent(new Event(CATALOG_EVENT));
}
function availableRoom(id: string) {
  const room = readCatalog().find((r) => r.detail.roomId === id);
  if (!room || room.postStatus !== 'APPROVED' || room.roomStatus !== 'AVAILABLE' || room.detail.rented) throw new Error('Phòng không còn khả dụng để nhận yêu cầu thuê.');
  return room;
}
function hasOpenContract(state: RentalState, roomId: string) { return state.tenancies.some((t) => t.roomId === roomId && ['PENDING', 'ACTIVE'].includes(t.status)); }
export function sendRental(roomId: string, note: string) {
  const user = actor('TENANT'); const state = readRental(); const room = availableRoom(roomId);
  if (note.length > 2000) throw new Error('Lời nhắn tối đa 2000 ký tự.');
  if (room.landlordId === user.id) throw new Error('Không thể thuê phòng của chính mình.');
  if (hasOpenContract(state, roomId)) throw new Error('Phòng đang có hợp đồng hoặc đang chờ đặt cọc.');
  if (state.requests.some((r) => r.roomId === roomId && r.tenantId === user.id && r.status === 'PENDING')) throw new Error('Bạn đã gửi yêu cầu cho phòng này.');
  const now = new Date().toISOString();
  const request: RentalRequest = { id: crypto.randomUUID(), roomId, postId: room.detail.postId, tenantId: user.id, landlordId: room.landlordId, note, status: 'PENDING', createdAt: now, updatedAt: now };
  state.requests.push(request); save(state); return request;
}
function reasonCheck(reason: string) { if (!reason.trim() || reason.length > 2000) throw new Error('Vui lòng nhập lý do, tối đa 2000 ký tự.'); }
export function cancelRental(id: string) {
  const user = actor('TENANT'); const state = readRental(); const request = state.requests.find((r) => r.id === id && r.tenantId === user.id);
  if (!request) throw new Error('Không tìm thấy yêu cầu.');
  if (request.status === 'CANCELLED') return;
  if (request.status !== 'PENDING') throw new Error('Chỉ hủy được yêu cầu đang chờ.');
  request.status = 'CANCELLED'; request.updatedAt = new Date().toISOString(); save(state);
}
export function rejectRental(id: string, reason: string) {
  const user = actor('LANDLORD'); reasonCheck(reason); const state = readRental(); const request = state.requests.find((r) => r.id === id && r.landlordId === user.id);
  if (!request || request.status !== 'PENDING') throw new Error('Yêu cầu không còn ở trạng thái chờ.');
  request.status = 'REJECTED'; request.rejectReason = reason.trim(); request.updatedAt = new Date().toISOString(); save(state);
}
function dateValid(s: string) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s; }
export function acceptRental(id: string, terms: ContractTerms, now = Date.now()) {
  const user = actor('LANDLORD'); const state = readRental(now); const request = state.requests.find((r) => r.id === id && r.landlordId === user.id);
  if (!request) throw new Error('Không tìm thấy yêu cầu thuộc chủ trọ.');
  if (request.status === 'ACCEPTED') {
    const existing = state.tenancies.find((t) => t.rentalRequestId === id);
    if (!existing) throw new Error('Không tìm thấy hợp đồng.');
    return existing;
  }
  if (request.status !== 'PENDING') throw new Error('Yêu cầu không còn ở trạng thái chờ.');
  const room = availableRoom(request.roomId);
  if (room.landlordId !== user.id || room.detail.postId !== request.postId) throw new Error('Thông tin phòng đã thay đổi.');
  if (hasOpenContract(state, request.roomId)) throw new Error('Phòng đã có hợp đồng đang hiệu lực hoặc chờ cọc.');
  if (!dateValid(terms.startDate) || !dateValid(terms.endDate) || terms.startDate < todayVN(now) || terms.startDate < room.detail.availableFrom || terms.endDate <= terms.startDate) throw new Error('Ngày bắt đầu phải từ hôm nay và ngày có thể thuê; ngày kết thúc phải sau ngày bắt đầu.');
  const amounts = [terms.monthlyRent, terms.depositAmount, terms.electricityUnitPrice, terms.waterUnitPrice, terms.initialElectricity, terms.initialWater];
  if (amounts.some((v) => !Number.isFinite(v) || v < 0 || !/^\d{1,13}(\.\d{1,2})?$/.test(String(v))) || terms.monthlyRent < 0.01) throw new Error('Tiền thuê phải lớn hơn 0; các khoản tiền/chỉ số không âm, tối đa 13 chữ số và 2 số lẻ.');
  if (terms.termsAndConditions.length > 5000) throw new Error('Điều khoản tối đa 5000 ký tự.');
  const deadline = terms.depositDeadline ? Date.parse(terms.depositDeadline) : now + 86400000;
  if (!Number.isFinite(deadline) || deadline <= now || todayVN(deadline) > terms.endDate) throw new Error('Hạn đặt cọc phải trong tương lai và không sau ngày kết thúc hợp đồng.');
  const timestamp = new Date(now).toISOString();
  const tenancy: Tenancy = { ...terms, id: crypto.randomUUID(), contractCode: `HD-${crypto.randomUUID()}`, rentalRequestId: id, roomId: request.roomId, tenantId: request.tenantId, landlordId: user.id, status: 'PENDING', depositDeadline: new Date(deadline).toISOString(), createdAt: timestamp, updatedAt: timestamp };
  request.status = 'ACCEPTED'; request.updatedAt = timestamp;
  state.requests.forEach((r) => { if (r.id !== id && r.roomId === request.roomId && r.status === 'PENDING') { r.status = 'REJECTED'; r.rejectReason = 'Phòng đã được chấp nhận cho một yêu cầu thuê khác'; r.updatedAt = timestamp; } });
  state.tenancies.push(tenancy); save(state); return tenancy;
}
export function cancelTenancy(id: string, reason: string) {
  const user = actor(); reasonCheck(reason); const state = readRental(); const t = state.tenancies.find((t) => t.id === id && (t.tenantId === user.id || t.landlordId === user.id));
  if (!t) throw new Error('Không tìm thấy hợp đồng.');
  if (t.status === 'CANCELLED') return;
  if (t.status !== 'PENDING') throw new Error('Chỉ hủy được hợp đồng đang chờ cọc.');
  t.status = 'CANCELLED'; t.cancellationReason = reason.trim(); t.updatedAt = new Date().toISOString(); save(state);
}
export function confirmDeposit(id: string, now = Date.now()) {
  const user = actor('LANDLORD'); const state = readRental(now); const t = state.tenancies.find((t) => t.id === id && t.landlordId === user.id);
  if (!t) throw new Error('Không tìm thấy hợp đồng thuộc chủ trọ.');
  if (t.status === 'ACTIVE') return t;
  if (t.status !== 'PENDING' || Date.parse(t.depositDeadline) <= now || t.endDate < todayVN(now)) throw new Error('Hợp đồng đã hủy, hết hạn cọc hoặc hết thời hạn thuê.');
  if (state.tenancies.some((other) => other.id !== t.id && other.roomId === t.roomId && other.status === 'ACTIVE')) throw new Error('Phòng đang có khách thuê.');
  t.status = 'ACTIVE'; t.depositConfirmedAt = new Date(now).toISOString(); t.updatedAt = t.depositConfirmedAt; save(state); return t;
}
