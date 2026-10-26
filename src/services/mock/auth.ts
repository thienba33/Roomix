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
// Mock-only overrides, because seed users are constants and the backend has
// no profile/status endpoint yet (UC01.4 / UC07.1-07.2). Overrides are stored
// per user id so an admin decision or a profile edit survives a reload and
// applies to every screen that reads the mock session.
const STATUS_OVERRIDES_KEY = 'roomix_mock_status_overrides_v1';
const PROFILE_OVERRIDES_KEY = 'roomix_mock_profile_overrides_v1';
const PASSWORD_OVERRIDES_KEY = 'roomix_mock_password_overrides_v1';
function overrides<T>(key: string): Record<string, T> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); }
  catch { return {}; }
}
function writeOverrides(key: string, value: Record<string, unknown>) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Không thể lưu thay đổi. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
}
function resolveUser(user: MockUser): MockUser {
  const status = overrides<MockUser['status']>(STATUS_OVERRIDES_KEY)[user.id] ?? user.status;
  const profile = overrides<{ fullName: string; phoneNumber: string }>(PROFILE_OVERRIDES_KEY)[user.id];
  return { ...user, status, ...(profile ?? {}) };
}
/** Every mock account (seeds + registered) with admin/profile overrides applied. */
export function listMockAccounts(): MockUser[] {
  if (typeof window === 'undefined') return seeds.map(resolveUser);
  const stored = accounts().map((account) => account.user);
  const seen = new Set<string>();
  return [...seeds, ...stored].filter((user) => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  }).map(resolveUser);
}
export function findMockUserById(id: string): MockUser | null {
  return listMockAccounts().find((user) => user.id === id) ?? null;
}
/** Admin-side status change (UC07.1/07.2) that also unblocks a mock login. */
export function setMockAccountStatusByEmail(email: string, status: MockUser['status']): MockUser | null {
  const user = listMockAccounts().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return null;
  const next = { ...overrides<MockUser['status']>(STATUS_OVERRIDES_KEY), [user.id]: status };
  writeOverrides(STATUS_OVERRIDES_KEY, next);
  window.dispatchEvent(new Event(AUTH_EVENT));
  return { ...user, status };
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
  const passwordOverride = seed ? overrides<string>(PASSWORD_OVERRIDES_KEY)[seed.id] : undefined;
  const seedMatch = seed && (passwordOverride ? passwordOverride === hash : password === 'Roomix123!');
  const user = seedMatch ? resolveUser(seed) : stored?.digest === hash ? resolveUser(stored.user) : null;
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
    if (!value || value.expiresAt <= Date.now() || !value.user) return null;
    // An admin lock/verification applied after login must take effect here,
    // otherwise a locked account would stay signed in until the token expires.
    const current = resolveUser(value.user);
    return current.status === 'ACTIVE' ? { ...value, user: current } : null;
  } catch { return null; }
}
/** UC01.4 (mock): edit own full name / phone. Email and username stay fixed,
 * mirroring the backend register DTO where they identify the account. */
export function updateMockProfile(userId: string, patch: { fullName: string; phoneNumber: string }): MockUser {
  const user = listMockAccounts().find((u) => u.id === userId);
  if (!user) throw new Error('Không tìm thấy tài khoản.');
  const nameError = registerValidators.fullName(patch.fullName);
  const phoneError = registerValidators.phone(patch.phoneNumber);
  if (nameError || phoneError) throw new Error(nameError || phoneError);
  const next = { fullName: patch.fullName.trim(), phoneNumber: patch.phoneNumber.trim() };
  const stored = accounts();
  const index = stored.findIndex((a) => a.user.id === userId);
  if (index >= 0) {
    stored[index] = { ...stored[index], user: { ...stored[index].user, ...next } };
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(stored)); }
    catch { throw new Error('Không thể lưu thay đổi. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
  } else {
    writeOverrides(PROFILE_OVERRIDES_KEY, { ...overrides(PROFILE_OVERRIDES_KEY), [userId]: next });
  }
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (session?.user?.id === userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: { ...session.user, ...next } }));
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
  return { ...user, ...next };
}
/** UC01.4 (mock): change own password after verifying the current one. */
export async function changeMockPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = listMockAccounts().find((u) => u.id === userId);
  if (!user) throw new Error('Không tìm thấy tài khoản.');
  const passwordError = registerValidators.password(newPassword);
  if (passwordError) throw new Error(passwordError);
  const seed = seeds.find((u) => u.id === userId);
  const currentHash = await digest(currentPassword);
  const passwordOverride = seed ? overrides<string>(PASSWORD_OVERRIDES_KEY)[seed.id] : undefined;
  const stored = accounts().find((a) => a.user.id === userId);
  const currentOk = seed
    ? (passwordOverride ? passwordOverride === currentHash : currentPassword === 'Roomix123!')
    : stored?.digest === currentHash;
  if (!currentOk) throw new Error('Mật khẩu hiện tại không đúng.');
  const nextHash = await digest(newPassword);
  if (stored) {
    const all = accounts().map((a) => a.user.id === userId ? { ...a, digest: nextHash } : a);
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all)); }
    catch { throw new Error('Không thể lưu thay đổi. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
  } else {
    writeOverrides(PASSWORD_OVERRIDES_KEY, { ...overrides<string>(PASSWORD_OVERRIDES_KEY), [userId]: nextHash });
  }
}
export function clearMockSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('roomix_mock_auth_role');
  window.dispatchEvent(new Event(AUTH_EVENT));
}
