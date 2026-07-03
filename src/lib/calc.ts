import type { Expense, ID, Person } from '@/types';

export interface PersonBalance {
  personId: ID;
  /** Tiền đã bỏ ra trả cho các khoản chi / tạm ứng. */
  paid: number;
  /** Phần tiêu dùng gốc (chưa trừ tài trợ được nhận). */
  share: number;
  /** Tổng tiền người này tài trợ (bao) cho nhóm. */
  sponsoredGiven: number;
  /** Tổng tiền người này được người khác tài trợ (giảm bớt). */
  sponsoredReceived: number;
  /** Tổng nghĩa vụ = share + sponsoredGiven − sponsoredReceived. */
  owed: number;
  /** paid − owed. Dương: được nhận lại · Âm: còn phải trả. */
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

/** Số tiền mỗi người phải chịu (hoặc được giảm, với tài trợ) cho một khoản. */
export const shareOf = (expense: Expense, people: Person[]): number => {
  const participants = resolveParticipants(expense, people);
  return participants.length === 0 ? 0 : expense.amount / participants.length;
};

export const computeBalances = (people: Person[], expenses: Expense[]): PersonBalance[] => {
  const paid = new Map<ID, number>();
  const share = new Map<ID, number>();
  const given = new Map<ID, number>();
  const received = new Map<ID, number>();
  people.forEach((p) => {
    paid.set(p.id, 0);
    share.set(p.id, 0);
    given.set(p.id, 0);
    received.set(p.id, 0);
  });

  for (const expense of expenses) {
    const participants = resolveParticipants(expense, people);

    if (expense.kind === 'sponsorship') {
      // Tài trợ: người tài trợ gánh khoản này thay cho người được giảm.
      if (participants.length === 0 || !given.has(expense.payerId)) continue;
      given.set(expense.payerId, given.get(expense.payerId)! + expense.amount);
      const perPerson = expense.amount / participants.length;
      for (const id of participants) {
        if (received.has(id)) received.set(id, received.get(id)! + perPerson);
      }
      continue;
    }

    // Khoản chi / tạm ứng: người trả bỏ tiền, người tham gia chịu phần chia.
    if (!paid.has(expense.payerId)) continue;
    paid.set(expense.payerId, paid.get(expense.payerId)! + expense.amount);
    if (participants.length === 0) continue;
    const perPerson = expense.amount / participants.length;
    for (const id of participants) {
      if (share.has(id)) share.set(id, share.get(id)! + perPerson);
    }
  }

  return people.map((p) => {
    const personPaid = paid.get(p.id) ?? 0;
    const personShare = share.get(p.id) ?? 0;
    const personGiven = given.get(p.id) ?? 0;
    const personReceived = received.get(p.id) ?? 0;
    const owed = personShare + personGiven - personReceived;
    return {
      personId: p.id,
      paid: personPaid,
      share: personShare,
      sponsoredGiven: personGiven,
      sponsoredReceived: personReceived,
      owed,
      balance: personPaid - owed,
    };
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

/** Tổng chi phí thực (khoản chi + tạm ứng), không tính tài trợ. */
export const grandTotal = (expenses: Expense[]): number =>
  expenses.filter((e) => e.kind !== 'sponsorship').reduce((sum, e) => sum + e.amount, 0);

export const totalByKind = (expenses: Expense[], kind: Expense['kind']): number =>
  expenses.filter((e) => e.kind === kind).reduce((sum, e) => sum + e.amount, 0);
