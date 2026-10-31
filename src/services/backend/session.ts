export interface SessionUser {
  id: string; username: string; email: string; fullName: string; phoneNumber: string;
  avatarUrl?: string | null; zalo?: string | null; createdAt?: string; updatedAt?: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
}
export interface AuthResponse {
  accessToken?: string; tokenType?: string; expiresIn: number; expiresAt?: number; user: SessionUser;
}
export const AUTH_EVENT = 'roomix:auth';
const SYNC_KEY = 'roomix_auth_signal_v1';
let session: AuthResponse | null = null;
let version = 0;
let initialized = false;
let restored = false;

function initialize() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  // Remove credentials saved by older versions. Only a non-secret signal is shared.
  try { localStorage.removeItem('roomix_api_session_v1'); } catch { /* Storage is optional. */ }
  window.addEventListener('storage', (event) => {
    if (event.key !== SYNC_KEY && event.key !== null) return;
    let loggedOut = true;
    try { loggedOut = JSON.parse(event.newValue || 'null')?.type !== 'login'; } catch { /* Fail closed. */ }
    version++;
    session = null;
    restored = loggedOut;
    window.dispatchEvent(new Event(AUTH_EVENT));
  });
}
function announce(type: 'login' | 'logout') {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify({ type, nonce: crypto.randomUUID() })); } catch { /* Storage is optional. */ }
}
function validate(value: AuthResponse) {
  if (!value.accessToken || value.accessToken.startsWith('mock-') || !value.user?.id
    || !['TENANT', 'LANDLORD', 'ADMIN'].includes(value.user.role) || value.user.status !== 'ACTIVE'
    || !Number.isFinite(value.expiresIn) || value.expiresIn <= 0) throw new Error('Phiên đăng nhập không hợp lệ.');
  return { ...value, expiresAt: Date.now() + value.expiresIn * 1000 };
}
export function readSession(): AuthResponse | null { initialize(); return session; }
export const readStoredSession = readSession;
export function sessionVersion() { initialize(); return version; }
export function needsSessionRestore() { initialize(); return !restored; }
export function finishSessionRestore(expected: number) { if (version === expected) restored = true; }
export function saveSession(value: AuthResponse) {
  initialize();
  const next = validate(value);
  version++;
  restored = true;
  session = next;
  announce('login');
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export function saveRefreshedSession(value: AuthResponse, expected: number) {
  if (version !== expected || (session && session.user.id !== value.user.id)) return false;
  const wasGuest = !session;
  session = validate(value);
  restored = true;
  if (wasGuest) window.dispatchEvent(new Event(AUTH_EVENT));
  return true;
}
export function updateSessionUser(user: SessionUser) {
  if (!session || session.user.id !== user.id) return;
  session = { ...session, user };
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export function clearSession() {
  initialize();
  version++;
  restored = true;
  session = null;
  announce('logout');
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// Refresh cookies rotate once. Serialize cookie changes across tabs as well.
let authQueue: Promise<unknown> = Promise.resolve();
export async function withAuthLock<T>(work: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('roomix-auth-cookie', work);
  const result = authQueue.then(work, work);
  authQueue = result.catch(() => undefined);
  return result;
}
