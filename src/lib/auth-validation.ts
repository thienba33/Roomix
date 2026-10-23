// Mirrors core-service LoginRequest / RegisterRequest. UI simulation still uses no API.
export function validateLoginUsername(value: string): string {
  if (!value.trim()) return 'Vui lòng nhập tên đăng nhập.';
  return value.length > 50 ? 'Tên đăng nhập tối đa 50 ký tự.' : '';
}

export function validateLoginPassword(value: string): string {
  if (!value.trim()) return 'Vui lòng nhập mật khẩu.';
  return value.length > 72 ? 'Mật khẩu tối đa 72 ký tự.' : '';
}

export const registerValidators = {
  fullName: (v: string) => !v.trim() ? 'Vui lòng nhập họ tên.' : v.length > 100 ? 'Họ tên tối đa 100 ký tự.' : '',
  username: (v: string) => !v.trim() ? 'Vui lòng nhập tên đăng nhập.' : !/^[a-zA-Z0-9._-]{4,50}$/.test(v) ? 'Tên đăng nhập 4–50 ký tự, chỉ gồm chữ, số, dấu . _ -' : '',
  email: (v: string) => !v.trim() ? 'Vui lòng nhập email.' : v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email hợp lệ, tối đa 254 ký tự.' : '',
  phone: (v: string) => !v.trim() ? 'Vui lòng nhập số điện thoại.' : !/^\+?[0-9]{9,15}$/.test(v) ? 'Số điện thoại 9–15 chữ số, có thể bắt đầu bằng +.' : '',
  password: (v: string) => !v.trim() ? 'Vui lòng nhập mật khẩu.' : v.length < 8 || v.length > 72 ? 'Mật khẩu từ 8–72 ký tự.' : '',
};
