import { ArrowRightLeft, Gift } from 'lucide-react';
import type { EntryKind, Expense, ID, Person, SplitMode } from '@/types';
import { useBillStore } from '@/store/useBillStore';
import { resolveParticipants } from '@/lib/calc';
import { formatMoney } from '@/lib/format';

const DEFAULT_TITLE: Record<EntryKind, string> = {
  expense: 'Khoản chi',
  sponsorship: 'Tài trợ',
  transfer: 'Chuyển tiền',
};

export const entryTitle = (entry: Pick<Expense, 'title' | 'kind'>) =>
  entry.title || DEFAULT_TITLE[entry.kind];

/** "cả nhóm (4 người)" · "An, Bình, Chi" · "5 người" */
export const whoText = (splitMode: SplitMode, ids: ID[], people: Person[]): string => {
  if (splitMode === 'equal') return `cả nhóm (${ids.length} người)`;
  if (ids.length > 3) return `${ids.length} người`;
  return ids.map((id) => people.find((p) => p.id === id)?.name ?? '?').join(', ');
};

export function EntryRow({ expense }: { expense: Expense }) {
  const people = useBillStore((s) => s.people);

  const nameOf = (id: ID | undefined) => people.find((p) => p.id === id)?.name ?? 'Người đã xoá';
  const ids = resolveParticipants(expense, people);
  const payer = nameOf(expense.payerId);
  const who = whoText(expense.splitMode, ids, people);

  const meta =
    expense.kind === 'transfer'
      ? `${payer} → ${nameOf(ids[0])}`
      : expense.kind === 'sponsorship'
        ? `${payer} tài trợ · giảm cho ${who}`
        : `${payer} trả · chia đều ${expense.splitMode === 'custom' ? 'cho ' : ''}${who}`;
  const tone =
    expense.kind === 'sponsorship' ? 'text-positive' : expense.kind === 'transfer' ? 'text-muted' : '';
  const Icon = expense.kind === 'sponsorship' ? Gift : expense.kind === 'transfer' ? ArrowRightLeft : null;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="leader">
        <span className="flex min-w-0 flex-shrink items-center gap-1.5 font-medium">
          {Icon && <Icon size={14} className={`shrink-0 ${tone}`} />}
          <span className="truncate">{entryTitle(expense)}</span>
        </span>
        <span className="leader__dots" />
        <span className={`mono shrink-0 font-semibold ${tone}`}>
          {expense.kind === 'sponsorship' ? '−' : ''}
          {formatMoney(expense.amount)}
        </span>
      </div>
      <p className="sect-hint truncate">{meta}</p>
    </div>
  );
}
