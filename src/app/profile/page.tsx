'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { tenantUser } from '@/lib/data';
import {
  getNotificationsEnabled,
  getNotificationPrefs,
  getTenantProfile,
  profileInitials,
  setNotificationsEnabled,
  setNotificationPrefs,
  setTenantProfile,
  type NotificationPrefs,
  type TenantProfile,
} from '@/lib/tenant-store';

const errCls = (bad: boolean) => (bad ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '');

function validateName(v: string): string {
  if (!v.trim()) return 'Vui lòng nhập họ tên';
  if (v.trim().length < 2) return 'Họ tên quá ngắn';
  return '';
}

function validatePhone(v: string): string {
  const digits = v.replace(/[\s.]/g, '');
  if (!digits) return 'Vui lòng nhập số điện thoại';
  if (!/^0\d{9}$/.test(digits)) return 'Số điện thoại phải gồm 10 số, bắt đầu bằng 0';
  return '';
}

function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-muted">{hint}</span>}
      </span>
      <span className={cn('flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition', checked ? 'justify-end bg-primary' : 'justify-start bg-line')}>
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
    >
      {show ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  );
}

export default function ProfilePage() {
  const toast = useToast();

  /* ------------------------------------------------------ info form state */
  const [saved, setSaved] = useState<TenantProfile>({ name: tenantUser.name, phone: tenantUser.phone, address: '' });
  const [form, setForm] = useState<TenantProfile>(saved);
  const [touched, setTouched] = useState({ name: false, phone: false });
  const errors = { name: validateName(form.name), phone: validatePhone(form.phone) };

  /* -------------------------------------------------- password form state */
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwTouched, setPwTouched] = useState({ current: false, next: false, confirm: false });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const pwErrors = {
    current: pw.current ? '' : 'Vui lòng nhập mật khẩu hiện tại',
    next: !pw.next
      ? 'Vui lòng nhập mật khẩu mới'
      : pw.next.length < 8
        ? 'Mật khẩu mới tối thiểu 8 ký tự'
        : pw.next === pw.current
          ? 'Mật khẩu mới phải khác mật khẩu hiện tại'
          : '',
    confirm: !pw.confirm ? 'Vui lòng nhập lại mật khẩu mới' : pw.confirm !== pw.next ? 'Mật khẩu nhập lại chưa khớp' : '',
  };

  /* ------------------------------------------------------------ prefs */
  const [masterOn, setMasterOn] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPrefs>({ email: true, inApp: true, push: false });

  useEffect(() => {
    const p = getTenantProfile();
    setSaved(p);
    setForm(p);
    setMasterOn(getNotificationsEnabled());
    setPrefs(getNotificationPrefs());
  }, []);

  const saveInfo = () => {
    setTouched({ name: true, phone: true });
    if (errors.name || errors.phone) return;
    const next: TenantProfile = { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() };
    setTenantProfile(next);
    setSaved(next);
    setForm(next);
    toast.push('Đã lưu hồ sơ', 'Thông tin cá nhân của bạn đã được cập nhật.');
  };

  const cancelInfo = () => {
    setForm(saved);
    setTouched({ name: false, phone: false });
  };

  const submitPassword = () => {
    setPwTouched({ current: true, next: true, confirm: true });
    if (pwErrors.current || pwErrors.next || pwErrors.confirm) return;
    // Mock seam: khi nối API thật, bước này gọi endpoint đổi mật khẩu của
    // auth service (core-service Auth) thay cho toast xác nhận tại chỗ.
    setPw({ current: '', next: '', confirm: '' });
    setPwTouched({ current: false, next: false, confirm: false });
    toast.push('Đã đổi mật khẩu', 'Mật khẩu mới sẽ được dùng cho lần đăng nhập tiếp theo.');
  };

  const toggleMaster = (on: boolean) => {
    setMasterOn(on);
    setNotificationsEnabled(on);
  };

  const togglePref = (key: keyof NotificationPrefs) => (on: boolean) => {
    const next = { ...prefs, [key]: on };
    setPrefs(next);
    setNotificationPrefs(next);
  };

  const dirty = form.name !== saved.name || form.phone !== saved.phone || form.address !== saved.address;

  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <div className="mx-auto max-w-[1060px]">
          <h1 className="text-[28px] font-extrabold text-ink">Hồ sơ của tôi</h1>
          <p className="mt-1 text-sm text-muted">Quản lý thông tin cá nhân, mật khẩu và tùy chọn thông báo</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
            {/* ------------------------------------------------ left column */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">
                    {profileInitials(saved.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-bold text-ink">{saved.name}</p>
                    <p className="truncate text-sm text-muted">{tenantUser.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-[12px] font-semibold text-primary">
                      Khách thuê
                    </span>
                  </div>
                </div>
                <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Email</span>
                    <span className="font-semibold text-[#16A34A]">✓ Đã xác minh</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Số điện thoại</span>
                    <span className="font-semibold text-[#16A34A]">✓ Đã xác minh</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Điện thoại</span>
                    <span className="font-medium text-ink">{saved.phone}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Trạng thái</span>
                    <span className="font-medium text-ink">Tài khoản đã xác minh</span>
                  </p>
                </div>
              </Card>

              <Card className="p-2">
                {[
                  { href: '/requests', label: 'Yêu cầu của tôi', icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
                  { href: '/favorites', label: 'Phòng yêu thích', icon: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /> },
                  { href: '/notifications', label: 'Thông báo', icon: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></> },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink transition hover:bg-page"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{l.icon}</svg>
                    {l.label}
                    <svg className="ml-auto text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </Link>
                ))}
              </Card>
            </div>

            {/* ------------------------------------------------ right column */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-[17px] font-bold text-ink">Thông tin cá nhân</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Input
                      label="Họ tên *"
                      name="name"
                      value={form.name}
                      autoComplete="name"
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      aria-invalid={touched.name && !!errors.name}
                      className={errCls(touched.name && !!errors.name)}
                    />
                    {touched.name && errors.name && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <Input
                      label="Số điện thoại *"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      autoComplete="tel"
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      aria-invalid={touched.phone && !!errors.phone}
                      className={errCls(touched.phone && !!errors.phone)}
                    />
                    {touched.phone && errors.phone && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{errors.phone}</p>}
                  </div>
                  <div>
                    <Input label="Email" name="email" type="email" value={tenantUser.email} disabled className="bg-page text-muted" />
                    <p className="mt-1.5 text-[13px] text-muted">Email dùng để đăng nhập, không thay đổi tại đây.</p>
                  </div>
                  <div>
                    <Input
                      label="Địa chỉ liên hệ"
                      name="address"
                      value={form.address}
                      autoComplete="street-address"
                      placeholder="Số nhà, đường, quận/huyện…"
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={cancelInfo} disabled={!dirty}>
                    Hủy
                  </Button>
                  <Button onClick={saveInfo} disabled={!dirty}>
                    Lưu thay đổi
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-[17px] font-bold text-ink">Đổi mật khẩu</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      { key: 'current', label: 'Mật khẩu hiện tại *', autoComplete: 'current-password' },
                      { key: 'next', label: 'Mật khẩu mới *', autoComplete: 'new-password' },
                      { key: 'confirm', label: 'Nhập lại mật khẩu mới *', autoComplete: 'new-password' },
                    ] as const
                  ).map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`pw-${f.key}`} className="mb-1.5 block text-[13px] font-semibold text-ink">
                        {f.label}
                      </label>
                      <div className="relative">
                        <Input
                          id={`pw-${f.key}`}
                          type={showPw[f.key] ? 'text' : 'password'}
                          value={pw[f.key]}
                          autoComplete={f.autoComplete}
                          onChange={(e) => setPw({ ...pw, [f.key]: e.target.value })}
                          onBlur={() => setPwTouched((t) => ({ ...t, [f.key]: true }))}
                          aria-invalid={pwTouched[f.key] && !!pwErrors[f.key]}
                          className={cn('pr-11', errCls(pwTouched[f.key] && !!pwErrors[f.key]))}
                        />
                        <EyeToggle show={showPw[f.key]} onToggle={() => setShowPw((s) => ({ ...s, [f.key]: !s[f.key] }))} />
                      </div>
                      {pwTouched[f.key] && pwErrors[f.key] && (
                        <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{pwErrors[f.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={submitPassword}>Đổi mật khẩu</Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-[17px] font-bold text-ink">Tùy chọn thông báo</h2>
                <div className="mt-2 divide-y divide-line/70">
                  <Switch
                    checked={masterOn}
                    onChange={toggleMaster}
                    label="Nhận thông báo"
                    hint="Công tắc chung — đồng bộ với menu avatar trên thanh điều hướng"
                  />
                  <Switch
                    checked={prefs.inApp}
                    onChange={togglePref('inApp')}
                    label="Thông báo trong ứng dụng"
                    hint="Hiện ở biểu tượng chuông và trang Thông báo"
                    disabled={!masterOn}
                  />
                  <Switch
                    checked={prefs.email}
                    onChange={togglePref('email')}
                    label="Thông báo qua email"
                    hint={`Gửi tới ${tenantUser.email}`}
                    disabled={!masterOn}
                  />
                  <Switch
                    checked={prefs.push}
                    onChange={togglePref('push')}
                    label="Thông báo đẩy"
                    hint="Hiện trên thiết bị ngay khi có cập nhật mới"
                    disabled={!masterOn}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TenantShell>
  );
}
