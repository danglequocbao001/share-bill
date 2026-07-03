import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { EntryKind } from '@/types';
import { useBillStore } from '@/store/useBillStore';
import { totalByKind } from '@/lib/calc';
import { formatMoney } from '@/lib/format';
import { EntryRow } from '@/components/EntryRow';
import { EntryForm } from '@/components/EntryForm';

interface EntriesSectionProps {
  kind: EntryKind;
  addLabel: string;
  emptyHint: string;
}

type Mode = { type: 'idle' } | { type: 'new' } | { type: 'edit'; id: string };

export function EntriesSection({ kind, addLabel, emptyHint }: EntriesSectionProps) {
  const people = useBillStore((s) => s.people);
  const expenses = useBillStore((s) => s.expenses);
  const [mode, setMode] = useState<Mode>({ type: 'idle' });

  const entries = expenses
    .filter((e) => e.kind === kind)
    .sort((a, b) => a.createdAt - b.createdAt);
  const subtotal = totalByKind(expenses, kind);
  const noPeople = people.length === 0;
  const isSponsor = kind === 'sponsorship';
  const subtotalLabel =
    kind === 'expense' ? 'Tạm tính' : kind === 'prepayment' ? 'Tổng tạm ứng' : 'Tổng tài trợ';

  const close = () => setMode({ type: 'idle' });

  return (
    <section className="flex flex-col">
      {entries.length === 0 && mode.type !== 'new' ? (
        <p className="sect-hint text-center italic">{emptyHint}</p>
      ) : (
        <div className="flex flex-col divide-y divide-line/60">
          {entries.map((entry) =>
            mode.type === 'edit' && mode.id === entry.id ? (
              <div key={entry.id} className="py-2">
                <EntryForm kind={kind} initial={entry} onDone={close} />
              </div>
            ) : (
              <EntryRow key={entry.id} expense={entry} onEdit={() => setMode({ type: 'edit', id: entry.id })} />
            ),
          )}
        </div>
      )}

      {entries.length > 0 && (
        <div className="leader mt-2 pt-2 text-muted">
          <span className="text-xs uppercase tracking-wider">{subtotalLabel}</span>
          <span className="leader__dots" />
          <span className={`mono text-sm font-semibold ${isSponsor ? 'text-positive' : 'text-ink'}`}>
            {isSponsor ? '−' : ''}
            {formatMoney(subtotal)}
          </span>
        </div>
      )}

      <div className="no-print mt-3">
        {mode.type === 'new' ? (
          <EntryForm kind={kind} onDone={close} />
        ) : (
          <button
            type="button"
            className="btn btn--ghost btn--block border-dashed"
            onClick={() => setMode({ type: 'new' })}
            disabled={noPeople}
          >
            <Plus size={16} />
            {noPeople ? 'Thêm người tham gia trước' : addLabel}
          </button>
        )}
      </div>
    </section>
  );
}
