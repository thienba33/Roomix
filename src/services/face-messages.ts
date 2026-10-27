export const faceActions: Record<string, string> = {
  CENTER: 'Nhìn chính diện và giữ yên.',
  TURN_LEFT: 'Đưa mũi về phía trái của khung hình và giữ một nhịp.',
  TURN_RIGHT: 'Đưa mũi về phía phải của khung hình và giữ một nhịp.',
};

const messages: Record<string, string> = {
  AI_UNAVAILABLE: 'Mô hình AI đang không khả dụng. Chưa có kết quả đăng ký.',
  REQUEST_TIMEOUT: 'Dịch vụ phản hồi quá lâu. Hãy đọc lại kết quả trước khi tạo phiên mới.',
  INVALID_SERVER_RESPONSE: 'Dịch vụ trả dữ liệu không hợp lệ. Vui lòng thử lại sau.',
  ADMIN_LOGIN_REQUIRED: 'Cần đăng nhập Admin bằng mật khẩu để đăng ký mặt.',
  CORE_SESSION_REJECTED: 'Core từ chối phiên xác thực. Hãy bắt đầu lại hoặc đăng nhập bằng mật khẩu.',
  CORE_SESSION_EXPIRED: 'Phiên xác thực đã hết hạn. Hãy bắt đầu lại.',
  SESSION_ALREADY_STARTED: 'Phiên đã được dùng. Hãy bắt đầu với phiên mới.',
  CHALLENGE_EXPIRED: 'Thử thách đã hết hạn. Hãy bắt đầu lại.',
  CORE_UNAVAILABLE: 'Chưa kết nối được Core. Bạn có thể đọc lại kết quả trước khi thử phiên mới.',
  DATABASE_UNAVAILABLE: 'Database đang không khả dụng. Vui lòng thử lại sau.',
  NO_FACE: 'Không phát hiện khuôn mặt. Đưa mặt vào khung hình rồi thử lại.',
  MULTIPLE_FACES: 'Chỉ để một người trong khung hình.',
  LOW_FACE_QUALITY: 'Mặt quá nhỏ hoặc thiếu sáng. Điều chỉnh camera rồi thử lại.',
  FACE_TOO_BLURRY: 'Ảnh mặt bị mờ. Giữ camera ổn định rồi thử lại.',
  FACE_OUTSIDE_IMAGE: 'Đưa toàn bộ khuôn mặt vào khung hình.',
  HEAD_TOO_TILTED: 'Giữ đầu thẳng, tránh nghiêng đầu.',
  FACE_CHANGED: 'Khuôn mặt thay đổi trong lúc thực hiện. Hãy thử lại với một người.',
  FACE_NOT_RECOGNIZED: 'Không nhận ra Admin đã đăng ký. Bạn có thể đăng nhập bằng mật khẩu.',
  AMBIGUOUS_FACE: 'Kết quả gần với nhiều hồ sơ. Hãy thử lại hoặc đăng nhập bằng mật khẩu.',
  FACE_ALREADY_ENROLLED: 'Khuôn mặt đã được đăng ký cho Admin khác.',
  LIVENESS_TIMEOUT: 'Một bước thực hiện quá lâu. Hãy bắt đầu lại và làm theo hướng dẫn.',
  LIVENESS_FAILED: 'Chưa hoàn thành thử thách chuyển động. Hãy thử lại.',
  CORE_REJECTED: 'Core không chấp nhận kết quả. Hãy kiểm tra quyền tài khoản.',
  CAMERA_UNAVAILABLE: 'Không truy cập được camera. Hãy dùng localhost hoặc HTTPS.',
  CAMERA_NOT_READY: 'Camera chưa có hình. Hãy thử lại.',
};

export function faceErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') return 'Đã dừng. Phiên chưa hoàn tất sẽ tự hết hạn.';
    if (error.name === 'NotAllowedError') return 'Bạn chưa cấp quyền camera.';
    if (error.name === 'NotFoundError') return 'Không tìm thấy camera trên thiết bị.';
    if (error.name === 'NotReadableError') return 'Không mở được camera. Kiểm tra ứng dụng khác đang sử dụng camera.';
  }
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    if (messages[error.code]) return messages[error.code];
    // Các lỗi AdminAuthError dùng thông báo cố định do ứng dụng tạo.
    if (error instanceof Error && error.name === 'AdminAuthError') return error.message;
  }
  return 'Chưa hoàn tất xác thực. Kiểm tra kết nối hoặc đọc lại kết quả trước khi thử lại.';
}

export function faceProgressMessage(action?: string, reason?: string): string {
  const instruction = faceActions[action ?? ''] ?? 'Đang chờ kết quả…';
  return reason === 'FACE_TOO_BLURRY'
    ? `Ảnh đang mờ. Giữ đầu yên để camera lấy nét. ${instruction}`
    : instruction;
}
