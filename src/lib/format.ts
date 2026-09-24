const vndCurrency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const vndNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** 500000 → "500.000 ₫" */
export const formatMoney = (value: number): string => vndCurrency.format(Math.round(value));

/** 500000 → "500.000" (không có ký hiệu tiền tệ, dùng cho ô nhập liệu) */
export const formatNumber = (value: number): string => vndNumber.format(Math.round(value));

const UNITS: Record<string, number> = { k: 1_000, tr: 1_000_000 };

/**
 * Hiểu cách gõ tiền quen thuộc: "1.200.000" · "50k" · "2,5k" · "1tr2" · "1.5tr".
 * Không có đơn vị thì chỉ giữ chữ số (VND không có số lẻ). Không hiểu được thì trả 0.
 */
export const parseAmount = (raw: string): number => {
  const text = raw.toLowerCase().replace(/[\s₫đ]/g, '');
  const match = /^(\d[\d.,]*)(k|tr)(\d*)$/.exec(text);
  if (!match) return Number.parseInt(text.replace(/\D/g, ''), 10) || 0;

  const [, head, unit, tail] = match;
  // Dấu chấm/phẩy đứng trước đúng 3 chữ số là phân cách hàng nghìn ("1.200k"), còn lại là dấu thập phân ("1,5k").
  const number = head!.replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(',', '.');
  // "1tr2" = 1,2 triệu: chữ số sau đơn vị là phần thập phân.
  const value = Number(tail ? `${number}.${tail}` : number) * UNITS[unit!]!;
  return Number.isFinite(value) ? Math.round(value) : 0;
};

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
};

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDateTime = (timestamp: number): string => dateFormatter.format(timestamp);
