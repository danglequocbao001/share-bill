export type ID = string;

export interface Person {
  id: ID;
  name: string;
}

/** `equal` = chia đều cho tất cả mọi người · `custom` = chia theo người đã chọn */
export type SplitMode = 'equal' | 'custom';

/**
 * `expense` = khoản chi (kể cả tạm ứng / chi hộ — có đòi lại)
 * `sponsorship` = tài trợ (không đòi lại — người tài trợ gánh phần này thay nhóm)
 * `transfer` = chuyển tiền trả nợ: `payerId` chuyển cho `participantIds[0]`
 */
export type EntryKind = 'expense' | 'sponsorship' | 'transfer';

export interface Expense {
  id: ID;
  /** Có thể để trống — khi hiển thị dùng tên mặc định theo loại. */
  title: string;
  amount: number;
  payerId: ID;
  splitMode: SplitMode;
  /** Chỉ dùng khi splitMode === 'custom'. Với 'equal' luôn tính theo toàn bộ nhóm. */
  participantIds: ID[];
  kind: EntryKind;
  createdAt: number;
}

export type ExpenseDraft = Omit<Expense, 'id' | 'createdAt'>;
