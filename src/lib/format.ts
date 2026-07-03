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

/** "500.000 ₫" / "500k" → 500000 (chỉ giữ lại chữ số) */
export const parseAmount = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
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
