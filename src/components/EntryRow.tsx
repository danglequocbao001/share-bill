import { Copy, Pencil, Trash2 } from 'lucide-react';
import type { Expense } from '@/types';
import { useBillStore } from '@/store/useBillStore';
import { resolveParticipants } from '@/lib/calc';
import { formatMoney } from '@/lib/format';

interface EntryRowProps {
  expense: Expense;
  onEdit: () => void;
}

export function EntryRow({ expense, onEdit }: EntryRowProps) {
  const people = useBillStore((s) => s.people);
  const removeEntry = useBillStore((s) => s.removeEntry);
  const duplicateEntry = useBillStore((s) => s.duplicateEntry);

  const payer = people.find((p) => p.id === expense.payerId);
  const participantCount = resolveParticipants(expense, people).length;
  const isSponsor = expense.kind === 'sponsorship';

  const splitLabel = isSponsor
    ? `Giảm cho ${participantCount} người`
    : expense.splitMode === 'equal'
      ? `Chia đều · ${participantCount} người`
      : `Chia theo ${expense.kind === 'prepayment' ? 'người' : 'món'} · ${participantCount} người`;
  const payerText = payer
    ? `${payer.name} ${isSponsor ? 'tài trợ' : 'trả'}`
    : `Người ${isSponsor ? 'tài trợ' : 'trả'} đã bị xóa`;

  return (
    <div className="animate-rise group flex flex-col gap-0.5 py-1.5">
      <div className="leader">
        <span className="min-w-0 flex-shrink truncate font-medium">{expense.title}</span>
        <span className="leader__dots" />
        <span className={`mono shrink-0 font-semibold ${isSponsor ? 'text-positive' : ''}`}>
          {isSponsor ? '−' : ''}
          {formatMoney(expense.amount)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="sect-hint min-w-0 truncate">
          {payerText} · {splitLabel}
        </p>
        <div className="no-print flex items-center opacity-60 transition-opacity group-hover:opacity-100">
          <button type="button" className="icon-btn" onClick={onEdit} aria-label="Sửa">
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => duplicateEntry(expense.id)}
            aria-label="Nhân đôi"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={() => removeEntry(expense.id)}
            aria-label="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
