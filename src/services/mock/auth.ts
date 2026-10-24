import { registerValidators, validateLoginPassword, validateLoginUsername } from '@/lib/auth-validation';

export interface MockUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
}
export interface AuthResponse {
  accessToken?: string;
  tokenType?: 'Bearer';
  expiresIn: number;
  user: MockUser;
}
export interface RegisterRequest {
  username: string; email: string; fullName: string; phoneNumber: string;
  password: string; role: 'TENANT' | 'LANDLORD';
}
type Account = { user: MockUser; digest: string };
const ACCOUNTS_KEY = 'roomix_mock_accounts_v1';
const SESSION_KEY = 'roomix_mock_session_v1';
export const AUTH_EVENT = 'roomix-mock-auth';
const seeds: MockUser[] = [
  { id: '10000000-0000-4000-8000-000000000005', username: 'admin_demo', email: 'admin@roomix.test', fullName: 'Quản trị Roomix', phoneNumber: '0901234569', role: 'ADMIN', status: 'ACTIVE' },
  { id: '10000000-0000-4000-8000-000000000001', username: 'tenant_demo', email: 'tenant@roomix.test', fullName: 'Trần Minh Anh', phoneNumber: '0912345678', role: 'TENANT', status: 'ACTIVE' },
  { id: '10000000-0000-4000-8000-000000000002', username: 'landlord_demo', email: 'landlord@roomix.test', fullName: 'Nguyễn Văn Hùng', phoneNumber: '0987654321', role: 'LANDLORD', status: 'ACTIVE' },
  { id: '10000000-0000-4000-8000-000000000003', username: 'pending_demo', email: 'pending@roomix.test', fullName: 'Chủ trọ chờ duyệt', phoneNumber: '0901234567', role: 'LANDLORD', status: 'PENDING_VERIFICATION' },
  { id: '10000000-0000-4000-8000-000000000004', username: 'locked_demo', email: 'locked@roomix.test', fullName: 'Tài khoản bị khóa', phoneNumber: '0901234568', role: 'TENANT', status: 'LOCKED' },
];
// Demo-only fingerprint, never a substitute for server password hashing/authentication.
async function digest(password: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
function accounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
  catch { throw new Error('Không thể đọc dữ liệu tài khoản trên trình duyệt.'); }
}
function response(user: MockUser): AuthResponse {
  return user.status === 'ACTIVE'
    ? { user, accessToken: `mock-only-${crypto.randomUUID()}`, tokenType: 'Bearer', expiresIn: 3600 }
    : { user, expiresIn: 0 };
}
export async function mockLogin(username: string, password: string): Promise<AuthResponse> {
  const validation = validateLoginUsername(username) || validateLoginPassword(password);
  if (validation) throw new Error(validation);
  const name = username.trim().toLowerCase();
  const seed = seeds.find((u) => u.username === name);
  const hash = await digest(password);
  const stored = accounts().find((a) => a.user.username.toLowerCase() === name);
  const user = seed && password === 'Roomix123!' ? seed : stored?.digest === hash ? stored.user : null;
  if (!user || user.status !== 'ACTIVE') throw new Error('Không thể đăng nhập. Vui lòng kiểm tra thông tin hoặc liên hệ quản trị viên nếu tài khoản chưa được kích hoạt hay đã bị khóa.');
  return response(user);
}
export async function mockRegister(request: RegisterRequest): Promise<AuthResponse> {
  const values = { ...request, phone: request.phoneNumber };
  for (const field of Object.keys(registerValidators) as (keyof typeof registerValidators)[]) {
    const error = registerValidators[field](values[field]);
    if (error) throw new Error(error);
  }
  if (!['TENANT', 'LANDLORD'].includes(request.role)) throw new Error('Vai trò không hợp lệ.');
  const hash = await digest(request.password);
  const saved = accounts();
  const users = [...seeds, ...saved.map((a) => a.user)];
  if (users.some((u) => u.username.toLowerCase() === request.username.toLowerCase())) throw new Error('Tên đăng nhập đã được sử dụng.');
  if (users.some((u) => u.email.toLowerCase() === request.email.toLowerCase())) throw new Error('Email đã được sử dụng.');
  const user: MockUser = {
    id: crypto.randomUUID(), username: request.username, email: request.email,
    fullName: request.fullName, phoneNumber: request.phoneNumber, role: request.role,
    status: request.role === 'LANDLORD' ? 'PENDING_VERIFICATION' : 'ACTIVE',
  };
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...saved, { user, digest: hash }])); }
  catch { throw new Error('Không thể lưu tài khoản. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
  return response(user);
}
export function saveMockSession(auth: AuthResponse) {
  if (!auth.accessToken || auth.user.status !== 'ACTIVE') throw new Error('Tài khoản chưa được kích hoạt.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...auth, expiresAt: Date.now() + auth.expiresIn * 1000 }));
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export function readMockSession(): AuthResponse | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return value?.expiresAt > Date.now() && value?.user?.status === 'ACTIVE' ? value : null;
  } catch { return null; }
}
export function clearMockSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('roomix_mock_auth_role');
  window.dispatchEvent(new Event(AUTH_EVENT));
}
