export type ID = string;

export interface Person {
  id: ID;
  name: string;
}

/** `equal` = chia đều cho tất cả mọi người · `custom` = chia theo người đã chọn */
export type SplitMode = 'equal' | 'custom';

/**
 * `expense` = khoản chi thường
 * `prepayment` = tạm ứng / chi hộ trước (có đòi lại)
 * `sponsorship` = tài trợ / bao (không đòi lại — người tài trợ gánh phần này thay nhóm)
 */
export type EntryKind = 'expense' | 'prepayment' | 'sponsorship';

export interface Expense {
  id: ID;
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
