// Chỉ giao tiếp với API công khai của Core qua Gateway. Không gọi Face khi login mật khẩu.
export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'ADMIN';
  status: 'ACTIVE';
}

export interface AdminSession {
  accessToken: string;
  expiresAt: number;
  user: AdminUser;
  method: 'PASSWORD' | 'FACE';
}

export interface EnrollmentSession {
  authSessionId: string;
  purpose: 'ENROLL';
  expiresAt: number;
}

export interface FaceLoginSession {
  authSessionId: string;
  purpose: 'LOGIN';
  expiresAt: number;
  // Bí mật nhận JWT, chỉ Core và trình duyệt tạo phiên biết. Không gửi sang Face.
  completionToken: string;
}

export class AdminAuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AdminAuthError';
    this.code = code;
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unwrap(value: unknown): Record<string, unknown> {
  // Core có thể trả DTO trực tiếp hoặc bọc trong ApiResponse.data.
  if (!object(value) || value.success === false) throw invalidResponse();
  const data = 'data' in value ? value.data : value;
  if (!object(data)) throw invalidResponse();
  return data;
}

function invalidResponse() {
  return new AdminAuthError('INVALID_RESPONSE', 'Phản hồi xác thực từ Core không hợp lệ.');
}

function readAdmin(value: Record<string, unknown>): AdminUser {
  if (value.role !== 'ADMIN' || value.status !== 'ACTIVE') {
    throw new AdminAuthError('ADMIN_REQUIRED', 'Tài khoản cần có quyền quản trị và không bị khóa.');
  }
  const fields = ['id', 'username', 'fullName', 'email'] as const;
  if (fields.some((key) => typeof value[key] !== 'string' || !value[key].trim())) {
    throw invalidResponse();
  }
  return {
    id: value.id as string, username: value.username as string,
    fullName: value.fullName as string, email: value.email as string,
    role: 'ADMIN', status: 'ACTIVE',
    ...(typeof value.phoneNumber === 'string' ? { phoneNumber: value.phoneNumber } : {}),
  };
}

export function createAdminAuthClient({
  baseUrl, fetchImpl = fetch, timeoutMs = 10000, clock = Date.now,
}: {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  clock?: () => number;
}) {
  const root = baseUrl.replace(/\/+$/, '');

  async function request(path: string, init: RequestInit, signal?: AbortSignal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${root}${path}`, {
        ...init, signal: controller.signal, cache: 'no-store', credentials: 'include', redirect: 'error',
      });
      if (!response.ok) {
        if (response.status === 401) throw new AdminAuthError('UNAUTHORIZED', 'Thông tin đăng nhập hoặc phiên xác thực không hợp lệ.');
        if (response.status === 403) throw new AdminAuthError('FORBIDDEN', 'Tài khoản không được phép đăng nhập quản trị.');
        if (response.status === 429) throw new AdminAuthError('RATE_LIMITED', 'Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.');
        if (response.status === 404) throw new AdminAuthError('API_NOT_READY', 'Core hoặc Gateway chưa cung cấp API xác thực cần thiết.');
        throw new AdminAuthError('CORE_UNAVAILABLE', 'Dịch vụ đăng nhập đang không khả dụng.');
      }
      let payload: unknown;
      try { payload = await response.json(); }
      catch {
        if (controller.signal.aborted) throw new AdminAuthError('TIMEOUT', 'Core phản hồi quá lâu. Vui lòng thử lại.');
        throw invalidResponse();
      }
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      return unwrap(payload);
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      if (error instanceof AdminAuthError) throw error;
      if (controller.signal.aborted) throw new AdminAuthError('TIMEOUT', 'Core phản hồi quá lâu. Vui lòng thử lại.');
      throw new AdminAuthError('NETWORK_ERROR', 'Không kết nối được Core qua Gateway. Kiểm tra dịch vụ và cấu hình mạng.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }

  function validFaceLoginSession(value: Record<string, unknown>) {
    return value.purpose === 'LOGIN' && typeof value.authSessionId === 'string'
      && value.authSessionId.length >= 16 && value.authSessionId.length <= 128
      && typeof value.completionToken === 'string' && /^[A-Za-z0-9_-]{32,256}$/.test(value.completionToken)
      && typeof value.expiresAt === 'number' && Number.isFinite(value.expiresAt)
      && Number.isSafeInteger(Math.ceil(value.expiresAt * 1000)) && value.expiresAt * 1000 > clock();
  }

  async function readSession(result: Record<string, unknown>, startedAt: number,
    method: AdminSession['method'], signal?: AbortSignal): Promise<AdminSession> {
    if (typeof result.accessToken !== 'string' || !result.accessToken.trim()
        || result.accessToken.startsWith('mock-only-')
        || (result.tokenType !== undefined && result.tokenType !== 'Bearer')
        || typeof result.expiresIn !== 'number' || !Number.isFinite(result.expiresIn)
        || result.expiresIn <= 0) throw invalidResponse();
    const expiresAt = startedAt + result.expiresIn * 1000;
    if (!Number.isSafeInteger(Math.ceil(expiresAt)) || expiresAt <= clock()) throw invalidResponse();

    const profile = await request('/api/users/me', {
      method: 'GET', headers: { Authorization: `Bearer ${result.accessToken}` },
    }, signal);
    const user = readAdmin(profile);
    if (expiresAt <= clock()) throw invalidResponse();
    return { accessToken: result.accessToken, expiresAt, user, method };
  }

  return {
    async createFaceLogin(signal?: AbortSignal): Promise<FaceLoginSession> {
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      const result = await request('/api/auth/face/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'LOGIN' }),
      }, signal);
      if (!validFaceLoginSession(result)) throw invalidResponse();
      return {
        authSessionId: result.authSessionId as string, purpose: 'LOGIN',
        expiresAt: result.expiresAt as number, completionToken: result.completionToken as string,
      };
    },
    async completeFaceLogin(ticket: FaceLoginSession, faceStatus: string, signal?: AbortSignal): Promise<AdminSession> {
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      if (faceStatus !== 'SUCCEEDED') {
        throw new AdminAuthError('FACE_NOT_VERIFIED', 'Khuôn mặt chưa được xác thực thành công.');
      }
      if (!validFaceLoginSession({ ...ticket })) throw invalidResponse();
      const startedAt = clock();
      const result = await request('/api/auth/face/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authSessionId: ticket.authSessionId, completionToken: ticket.completionToken }),
      }, signal);
      return readSession(result, startedAt, 'FACE', signal);
    },
    async createEnrollment(session: AdminSession, signal?: AbortSignal): Promise<EnrollmentSession> {
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      if (session.method !== 'PASSWORD' || session.user.role !== 'ADMIN'
          || session.user.status !== 'ACTIVE' || session.expiresAt <= clock()
          || !session.accessToken || session.accessToken.startsWith('mock-only-')) {
        throw new AdminAuthError('PASSWORD_LOGIN_REQUIRED', 'Đăng nhập Admin bằng mật khẩu trước khi đăng ký khuôn mặt.');
      }
      const result = await request('/api/auth/face/sessions', {
        method: 'POST', headers: {
          'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}`,
        }, body: JSON.stringify({ purpose: 'ENROLL' }),
      }, signal);
      if (result.purpose !== 'ENROLL' || typeof result.authSessionId !== 'string'
          || result.authSessionId.length < 16 || result.authSessionId.length > 128
          || typeof result.expiresAt !== 'number' || !Number.isFinite(result.expiresAt)
          || !Number.isSafeInteger(Math.ceil(result.expiresAt * 1000))
          || result.expiresAt * 1000 <= clock() || session.expiresAt <= clock()) {
        throw invalidResponse();
      }
      return { authSessionId: result.authSessionId, purpose: 'ENROLL', expiresAt: result.expiresAt };
    },
    async login(username: string, password: string): Promise<AdminSession> {
      const startedAt = clock();
      const result = await request('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      return readSession(result, startedAt, 'PASSWORD');
    },
  };
}
