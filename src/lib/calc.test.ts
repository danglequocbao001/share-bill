// Tự kiểm tra phần tính tiền. Chạy: pnpm test (Node ≥ 22.18 chạy thẳng file .ts)
import type { Expense } from '../types.ts';
import { computeBalances, simplifyDebts } from './calc.ts';
import { parseAmount } from './format.ts';

const check = (actual: unknown, expected: unknown, label: string) => {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a !== e) throw new Error(`${label}: nhận ${a}, cần ${e}`);
};

const amounts: [string, number][] = [
  ['1.200.000', 1_200_000],
  ['1200000', 1_200_000],
  ['500.000 ₫', 500_000],
  ['50k', 50_000],
  ['50 K', 50_000],
  ['2,5k', 2_500],
  ['1.200k', 1_200_000],
  ['1tr', 1_000_000],
  ['1tr2', 1_200_000],
  ['1tr25', 1_250_000],
  ['1.5tr', 1_500_000],
  ['', 0],
  ['k', 0],
];
for (const [raw, expected] of amounts) check(parseAmount(raw), expected, raw);

const people = [
  { id: 'a', name: 'An' },
  { id: 'b', name: 'Bình' },
];
const entry = (kind: Expense['kind'], amount: number, payerId: string, participantIds = ['a', 'b']): Expense => ({
  id: `${kind}-${amount}`,
  title: '',
  amount,
  payerId,
  participantIds,
  kind,
  splitMode: kind === 'transfer' ? 'custom' : 'equal',
  createdAt: 0,
});

// An trả 100k chia đôi → Bình nợ 50k; An tài trợ 20k cho cả hai → Bình được giảm 10k, còn nợ 40k.
const bill = [entry('expense', 100_000, 'a'), entry('sponsorship', 20_000, 'a')];
check(simplifyDebts(computeBalances(people, bill)), [{ fromId: 'b', toId: 'a', amount: 40_000 }], 'tài trợ');

// Bình chuyển An 40k → hết nợ.
const settled = computeBalances(people, [...bill, entry('transfer', 40_000, 'b', ['a'])]);
check(
  settled.map((b) => b.balance),
  [0, 0],
  'chuyển tiền',
);

console.log('calc ok');
