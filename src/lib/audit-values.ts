// Audit payloads can contain account changes. Do not render credentials in the DOM.
export function redactAuditValues(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[Dữ liệu lồng nhiều cấp]';
  if (Array.isArray(value)) return value.map((item) => redactAuditValues(item, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, /password|passwd|token|secret|cookie|authorization|credential|api.?key/i.test(key) ? '[Đã ẩn]' : redactAuditValues(item, depth + 1),
  ]));
  return value;
}
