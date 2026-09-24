import type { Expense, ID, Person } from '@/types';

export interface PersonBalance {
  personId: ID;
  /** Tiền đã bỏ ra trả cho các khoản chi. */
  paid: number;
  /** Phần tiêu dùng gốc (chưa trừ phần được tài trợ). */
  share: number;
  /** Tổng tiền người này tài trợ cho nhóm. */
  sponsoredGiven: number;
  /** Tổng tiền người này được người khác tài trợ (giảm bớt). */
  sponsoredReceived: number;
  /** Tiền đã chuyển trả người khác. */
  sent: number;
  /** Tiền đã nhận lại từ người khác. */
  received: number;
  /** Tổng nghĩa vụ = share + sponsoredGiven − sponsoredReceived. */
  owed: number;
  /** paid − owed + sent − received. Dương: được nhận lại · Âm: còn phải trả. */
  balance: number;
}

export interface Settlement {
  fromId: ID;
  toId: ID;
  amount: number;
}

/** Nửa đồng — dùng làm ngưỡng bỏ qua sai số làm tròn dấu phẩy động. */
const EPSILON = 0.5;

/**
 * Danh sách người thực sự tham gia chia một khoản.
 * - `equal`: toàn bộ nhóm hiện tại (tự cập nhật khi thêm/bớt người).
 * - `custom`: đúng những người đã chọn, loại bỏ người đã bị xóa.
 */
export const resolveParticipants = (expense: Expense, people: Person[]): ID[] => {
  if (expense.splitMode === 'equal') return people.map((p) => p.id);
  const existing = new Set(people.map((p) => p.id));
  return expense.participantIds.filter((id) => existing.has(id));
};

export const computeBalances = (people: Person[], expenses: Expense[]): PersonBalance[] => {
  const rows = new Map(
    people.map((p) => [
      p.id,
      { paid: 0, share: 0, sponsoredGiven: 0, sponsoredReceived: 0, sent: 0, received: 0 },
    ]),
  );

  for (const expense of expenses) {
    const payer = rows.get(expense.payerId);
    const participants = resolveParticipants(expense, people);
    // Mất người trả hoặc không còn ai chịu thì bỏ qua cả khoản, để tổng số dư luôn bằng 0.
    if (!payer || participants.length === 0) continue;
    const perPerson = expense.amount / participants.length;

    if (expense.kind === 'transfer') {
      payer.sent += expense.amount;
      for (const id of participants) rows.get(id)!.received += perPerson;
    } else if (expense.kind === 'sponsorship') {
      // Tài trợ: người tài trợ gánh khoản này thay cho người được giảm.
      payer.sponsoredGiven += expense.amount;
      for (const id of participants) rows.get(id)!.sponsoredReceived += perPerson;
    } else {
      payer.paid += expense.amount;
      for (const id of participants) rows.get(id)!.share += perPerson;
    }
  }

  return people.map((p) => {
    const row = rows.get(p.id)!;
    const owed = row.share + row.sponsoredGiven - row.sponsoredReceived;
    return { personId: p.id, ...row, owed, balance: row.paid - owed + row.sent - row.received };
  });
};

/**
 * Rút gọn công nợ: ghép người dư (+) với người thiếu (−) theo kiểu tham lam
 * "lớn gặp lớn" để giảm tối đa số giao dịch cần thực hiện.
 */
export const simplifyDebts = (balances: PersonBalance[]): Settlement[] => {
  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .map((b) => ({ id: b.personId, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ id: b.personId, remaining: -b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > EPSILON) {
      settlements.push({ fromId: debtor.id, toId: creditor.id, amount: Math.round(amount) });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining <= EPSILON) i += 1;
    if (creditor.remaining <= EPSILON) j += 1;
  }

  return settlements.filter((s) => s.amount > 0);
};

/** Tổng chi phí thực, không tính tài trợ và chuyển tiền. */
export const grandTotal = (expenses: Expense[]): number => totalByKind(expenses, 'expense');

export const totalByKind = (expenses: Expense[], kind: Expense['kind']): number =>
  expenses.filter((e) => e.kind === kind).reduce((sum, e) => sum + e.amount, 0);
