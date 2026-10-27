import type { ListingInput } from '@/services/backend/rooms';

export type ListingFieldErrors = Partial<Record<keyof ListingInput, string>>;

/** Shared validation for the listing form; saving a draft does not require photos or a positive rent. */
export function validateListingInput(input: ListingInput): ListingFieldErrors {
  const errors: ListingFieldErrors = {};
  if (!input.roomNumber.trim()) errors.roomNumber = 'Nhập số phòng.';
  else if (input.roomNumber.length > 50) errors.roomNumber = 'Số phòng tối đa 50 ký tự.';
  if (!Number.isFinite(input.area) || input.area < 0.01) errors.area = 'Diện tích phải từ 0,01 m².';
  if (!Number.isFinite(input.basePrice) || input.basePrice < 0) errors.basePrice = 'Nhập giá thuê không âm. Có thể lưu nháp với giá 0.';
  if (!Number.isFinite(input.depositAmount) || input.depositAmount < 0) errors.depositAmount = 'Nhập tiền cọc không âm.';
  if (!Number.isInteger(input.maxTenants) || input.maxTenants < 1) errors.maxTenants = 'Số người phải là số nguyên từ 1 trở lên.';
  if (!input.title.trim()) errors.title = 'Nhập tiêu đề tin đăng.';
  else if (input.title.length > 200) errors.title = 'Tiêu đề tối đa 200 ký tự.';
  if (!input.description.trim()) errors.description = 'Nhập mô tả phòng.';
  if (input.amenitiesDescription.length > 3000) errors.amenitiesDescription = 'Mô tả tiện ích tối đa 3.000 ký tự.';
  const date = Date.parse(input.availableFrom);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.availableFrom) || !Number.isFinite(date)
    || new Date(date).toISOString().slice(0, 10) !== input.availableFrom) {
    errors.availableFrom = 'Chọn ngày có thể thuê hợp lệ.';
  }
  return errors;
}

export class ListingValidationError extends Error {
  constructor(public readonly fields: ListingFieldErrors) {
    super(Object.values(fields)[0] ?? 'Kiểm tra lại thông tin tin đăng.');
    this.name = 'ListingValidationError';
  }
}

export function getSubmissionRequirements(area: number, price: number, imageCount: number) {
  return [
    { label: 'Diện tích lớn hơn 0 m²', met: Number.isFinite(area) && area > 0 },
    { label: 'Giá thuê lớn hơn 0 đồng', met: Number.isFinite(price) && price > 0 },
    { label: 'Có ít nhất một ảnh phòng', met: imageCount > 0 },
  ];
}
