import { useMemo, useState } from 'react';
import { Check, Equal, ListChecks, X } from 'lucide-react';
import type { Expense, EntryKind, SplitMode } from '@/types';
import { useBillStore } from '@/store/useBillStore';
import { formatMoney } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { MoneyInput } from '@/components/MoneyInput';

interface EntryFormProps {
  kind: EntryKind;
  initial?: Expense;
  onDone: () => void;
}

interface KindCopy {
  titlePlaceholder: string;
  noun: string;
  payerLabel: string;
  splitLabel: string;
  equalLabel: string;
  customLabel: string;
  participantsQuestion: string;
  perPersonPrefix: string;
  customHint?: string;
}

const COPY: Record<EntryKind, KindCopy> = {
  expense: {
    titlePlaceholder: 'Tên khoản chi (Lẩu, Trà sữa, Taxi…)',
    noun: 'khoản chi',
    payerLabel: 'Người trả',
    splitLabel: 'Cách chia',
    equalLabel: 'Chia đều',
    customLabel: 'Chia theo món',
    participantsQuestion: 'Ai tham gia món này?',
    perPersonPrefix: 'Mỗi người chịu',
  },
  prepayment: {
    titlePlaceholder: 'Nội dung tạm ứng (Mua đồ chung…)',
    noun: 'khoản tạm ứng',
    payerLabel: 'Người ứng tiền',
    splitLabel: 'Cách chia',
    equalLabel: 'Chia đều',
    customLabel: 'Chia theo người',
    participantsQuestion: 'Ứng cho ai?',
    perPersonPrefix: 'Mỗi người chịu',
  },
  sponsorship: {
    titlePlaceholder: 'Nội dung tài trợ (Sếp bao, Quỹ nhóm…)',
    noun: 'khoản tài trợ',
    payerLabel: 'Người tài trợ',
    splitLabel: 'Giảm cho ai',
    equalLabel: 'Cả nhóm',
    customLabel: 'Chọn người',
    participantsQuestion: 'Ai được giảm?',
    perPersonPrefix: 'Mỗi người được giảm',
    customHint: 'Mẹo: bỏ chọn chính mình nếu bạn bao cho người khác.',
  },
};

export function EntryForm({ kind, initial, onDone }: EntryFormProps) {
  const people = useBillStore((s) => s.people);
  const addEntry = useBillStore((s) => s.addEntry);
  const updateEntry = useBillStore((s) => s.updateEntry);

  const allIds = useMemo(() => people.map((p) => p.id), [people]);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [payerId, setPayerId] = useState(initial?.payerId ?? people[0]?.id ?? '');
  const [splitMode, setSplitMode] = useState<SplitMode>(initial?.splitMode ?? 'equal');
  const [participantIds, setParticipantIds] = useState<string[]>(
    initial?.splitMode === 'custom' ? initial.participantIds : allIds,
  );

  const activeParticipants = splitMode === 'equal' ? allIds : participantIds;
  const share = activeParticipants.length > 0 ? amount / activeParticipants.length : 0;

  const canSave =
    title.trim().length > 0 && amount > 0 && !!payerId && activeParticipants.length > 0;

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const save = () => {
    if (!canSave) return;
    const draft = {
      title: title.trim(),
      amount,
      payerId,
      splitMode,
      participantIds: splitMode === 'custom' ? participantIds : allIds,
      kind,
    };
    if (initial) updateEntry(initial.id, draft);
    else addEntry(draft);
    onDone();
  };

  return (
    <div className="animate-rise flex flex-col gap-3 rounded-xl border border-sand bg-cream/60 p-3">
      <input
        autoFocus
        className="field"
        placeholder={COPY[kind].titlePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <MoneyInput value={amount} onChange={setAmount} flat />

      <div className="flex flex-col gap-1.5">
        <span className="sect-hint">{COPY[kind].payerLabel}</span>
        <div className="flex flex-wrap gap-1.5">
          {people.map((person) => {
            const active = payerId === person.id;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setPayerId(person.id)}
                className="chip"
                style={
                  active
                    ? { borderColor: 'var(--color-ink)', background: 'var(--color-paper)' }
                    : undefined
                }
              >
                <Avatar name={person.name} />
                {person.name}
                {active && <Check size={14} className="text-ink" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="sect-hint">{COPY[kind].splitLabel}</span>
        <div className="seg">
          <button
            type="button"
            className="seg__item"
            data-active={splitMode === 'equal'}
            onClick={() => setSplitMode('equal')}
          >
            <Equal size={14} />
            {COPY[kind].equalLabel}
          </button>
          <button
            type="button"
            className="seg__item"
            data-active={splitMode === 'custom'}
            onClick={() => setSplitMode('custom')}
          >
            <ListChecks size={14} />
            {COPY[kind].customLabel}
          </button>
        </div>
      </div>

      {splitMode === 'custom' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="sect-hint">{COPY[kind].participantsQuestion}</span>
            <button
              type="button"
              className="sect-hint underline underline-offset-2 hover:text-ink"
              onClick={() =>
                setParticipantIds(participantIds.length === allIds.length ? [] : allIds)
              }
            >
              {participantIds.length === allIds.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          {!!COPY[kind].customHint && (
            <p className="text-[0.68rem] italic text-muted">{COPY[kind].customHint}</p>
          )}
          <div className="flex flex-col divide-y divide-line/70">
            {people.map((person) => {
              const checked = participantIds.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  className="flex items-center gap-2.5 py-1.5 text-left"
                  onClick={() => toggleParticipant(person.id)}
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px]"
                    style={{
                      borderColor: checked ? 'var(--color-ink)' : 'var(--color-sand)',
                      background: checked ? 'var(--color-ink)' : 'transparent',
                    }}
                  >
                    {checked && <Check size={13} className="text-paper" />}
                  </span>
                  <Avatar name={person.name} />
                  <span className="flex-1 text-sm">{person.name}</span>
                  {checked && share > 0 && (
                    <span className="mono text-xs text-muted">{formatMoney(share)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {canSave && (
        <p className="sect-hint text-center">
          {COPY[kind].perPersonPrefix}{' '}
          <span className="mono font-semibold text-ink">{formatMoney(share)}</span>
          {' · '}
          {activeParticipants.length} người
        </p>
      )}

      <div className="flex gap-2 pt-0.5">
        <button type="button" className="btn btn--ghost flex-1" onClick={onDone}>
          <X size={16} />
          Hủy
        </button>
        <button type="button" className="btn btn--primary flex-1" onClick={save} disabled={!canSave}>
          <Check size={16} />
          {initial ? 'Cập nhật' : `Lưu ${COPY[kind].noun}`}
        </button>
      </div>
    </div>
  );
}
