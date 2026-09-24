import { useState, type ReactNode } from 'react';
import { ArrowRightLeft, Check, Copy, Gift, Receipt, Trash2, X } from 'lucide-react';
import type { EntryKind, Expense, ID, SplitMode } from '@/types';
import { useBillStore, withUndo } from '@/store/useBillStore';
import { useToast } from '@/store/useToast';
import { formatMoney } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { MoneyInput } from '@/components/MoneyInput';
import { Sheet } from '@/components/Sheet';
import { entryTitle, whoText } from '@/components/EntryRow';

const KINDS = [
  {
    kind: 'expense',
    label: 'Chi tiêu',
    icon: Receipt,
    hint: 'Ai đó trả tiền, cả nhóm hoặc vài người cùng chịu. Tạm ứng / chi hộ cũng ghi ở đây.',
  },
  {
    kind: 'sponsorship',
    label: 'Tài trợ',
    icon: Gift,
    hint: 'Ai đó tài trợ cho nhóm, không đòi lại — giảm tiền cho những người được chọn.',
  },
  {
    kind: 'transfer',
    label: 'Chuyển tiền',
    icon: ArrowRightLeft,
    hint: 'Ghi lại khi ai đó đã chuyển tiền trả nợ cho người khác.',
  },
] as const;

interface KindCopy {
  titlePlaceholder: string;
  payerLabel: string;
  splitLabel: string;
  missingPayer: string;
  missingSplit: string;
}

const COPY: Record<EntryKind, KindCopy> = {
  expense: {
    titlePlaceholder: 'Nội dung: lẩu, taxi… (không bắt buộc)',
    payerLabel: 'Ai trả?',
    splitLabel: 'Chia cho',
    missingPayer: 'người trả',
    missingSplit: 'người cùng chia',
  },
  sponsorship: {
    titlePlaceholder: 'Nội dung: sếp tài trợ… (không bắt buộc)',
    payerLabel: 'Ai tài trợ?',
    splitLabel: 'Giảm cho',
    missingPayer: 'người tài trợ',
    missingSplit: 'người được giảm',
  },
  transfer: {
    titlePlaceholder: 'Ghi chú (không bắt buộc)',
    payerLabel: 'Ai chuyển?',
    splitLabel: 'Chuyển cho ai?',
    missingPayer: 'người chuyển',
    missingSplit: 'người nhận',
  },
};

interface EntrySheetProps {
  initial?: Expense;
  onClose: () => void;
}

/** Bảng thêm / sửa khoản. */
export function EntrySheet({ initial, onClose }: EntrySheetProps) {
  return (
    <Sheet onClose={onClose}>
      <EntryForm initial={initial} onClose={onClose} />
    </Sheet>
  );
}

interface FieldProps {
  label: string;
  error?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

function Field({ label, error, action, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`sect-hint ${error ? 'font-semibold text-accent' : ''}`}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function EntryForm({ initial, onClose }: EntrySheetProps) {
  const people = useBillStore((s) => s.people);
  const addEntry = useBillStore((s) => s.addEntry);
  const updateEntry = useBillStore((s) => s.updateEntry);
  const removeEntry = useBillStore((s) => s.removeEntry);
  const duplicateEntry = useBillStore((s) => s.duplicateEntry);
  const notify = useToast((s) => s.notify);

  const wasCustom = initial?.splitMode === 'custom' && initial.kind !== 'transfer';

  const [kind, setKind] = useState<EntryKind>(initial?.kind ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [title, setTitle] = useState(initial?.title ?? '');
  // Không chọn sẵn người trả: lần nào cũng phải tự chọn cho đỡ nhầm.
  const [payerId, setPayerId] = useState<ID>(initial?.payerId ?? '');
  const [splitMode, setSplitMode] = useState<SplitMode>(wasCustom ? 'custom' : 'equal');
  const [picked, setPicked] = useState<ID[]>(wasCustom ? initial.participantIds : []);
  const [toId, setToId] = useState<ID>(
    initial?.kind === 'transfer' ? (initial.participantIds[0] ?? '') : '',
  );
  const [tried, setTried] = useState(false);

  const copy = COPY[kind];
  const isTransfer = kind === 'transfer';
  const allIds = people.map((p) => p.id);
  const ids = isTransfer ? (toId ? [toId] : []) : splitMode === 'equal' ? allIds : picked;
  const perPerson = ids.length > 0 ? amount / ids.length : 0;
  const nameOf = (id: ID) => people.find((p) => p.id === id)?.name ?? '?';

  const missing = [
    amount <= 0 && 'số tiền',
    !payerId && copy.missingPayer,
    ids.length === 0 && copy.missingSplit,
  ].filter((m): m is string => !!m);

  const who = whoText(splitMode, ids, people);
  const summary = isTransfer
    ? `${nameOf(payerId)} chuyển cho ${nameOf(toId)} ${formatMoney(amount)}`
    : kind === 'sponsorship'
      ? `${nameOf(payerId)} tài trợ ${formatMoney(amount)} · giảm cho ${who} · mỗi người được giảm ${formatMoney(perPerson)}`
      : `${nameOf(payerId)} trả ${formatMoney(amount)} · chia đều ${splitMode === 'custom' ? 'cho ' : ''}${who} · mỗi người ${formatMoney(perPerson)}`;

  const choosePayer = (id: ID) => {
    setPayerId(id);
    if (id === toId) setToId('');
  };

  const togglePicked = (id: ID) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const save = () => {
    if (missing.length > 0) {
      setTried(true);
      return;
    }
    const draft = {
      kind,
      amount,
      title: title.trim(),
      payerId,
      splitMode: isTransfer ? ('custom' as const) : splitMode,
      participantIds: ids,
    };
    if (initial) updateEntry(initial.id, draft);
    else addEntry(draft);
    onClose();
  };

  const remove = () => {
    if (!initial) return;
    onClose();
    withUndo(`Đã xoá “${entryTitle(initial)}”`, () => removeEntry(initial.id));
  };

  const duplicate = () => {
    if (!initial) return;
    duplicateEntry(initial.id);
    onClose();
    notify(`Đã nhân đôi “${entryTitle(initial)}”`);
  };

  const personChips = (selected: ID, onPick: (id: ID) => void, excludeId?: ID) => (
    <div className="flex flex-wrap gap-1.5">
      {people
        .filter((p) => p.id !== excludeId)
        .map((person) => (
          <button
            key={person.id}
            type="button"
            className="chip pr-3"
            aria-pressed={selected === person.id}
            onClick={() => onPick(person.id)}
          >
            <Avatar name={person.name} />
            {person.name}
            {selected === person.id && <Check size={14} />}
          </button>
        ))}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{initial ? 'Sửa khoản' : 'Thêm khoản'}</h2>
        {initial && (
          <div className="flex gap-1.5">
            <button type="button" className="btn btn--ghost px-2.5 py-1.5 text-xs" onClick={duplicate}>
              <Copy size={14} />
              Nhân đôi
            </button>
            <button
              type="button"
              className="btn btn--ghost px-2.5 py-1.5 text-xs text-accent"
              onClick={remove}
            >
              <Trash2 size={14} />
              Xoá
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="seg">
          {KINDS.map(({ kind: k, label, icon: Icon }) => (
            <button
              key={k}
              type="button"
              className="seg__item flex-col gap-1 py-2"
              data-active={kind === k}
              onClick={() => setKind(k)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <p className="sect-hint">{KINDS.find((k) => k.kind === kind)!.hint}</p>
      </div>

      <MoneyInput
        value={amount}
        onChange={setAmount}
        autoFocus={!initial}
        invalid={tried && amount <= 0}
      />

      <input
        className="field"
        placeholder={copy.titlePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Field label={copy.payerLabel} error={tried && !payerId}>
        {personChips(payerId, choosePayer)}
      </Field>

      {isTransfer ? (
        <Field label={copy.splitLabel} error={tried && !toId}>
          {personChips(toId, setToId, payerId)}
        </Field>
      ) : (
        <Field
          label={copy.splitLabel}
          error={tried && ids.length === 0}
          action={
            <button
              type="button"
              className="sect-hint underline underline-offset-2 hover:text-ink"
              onClick={() => setSplitMode(splitMode === 'equal' ? 'custom' : 'equal')}
            >
              {splitMode === 'equal' ? 'Tuỳ chỉnh' : 'Chia cả nhóm'}
            </button>
          }
        >
          {splitMode === 'equal' ? (
            <p className="rounded-xl bg-cream px-3 py-2 text-sm">Cả nhóm · {allIds.length} người</p>
          ) : (
            <div className="flex flex-col divide-y divide-line/70">
              {people.map((person) => {
                const checked = picked.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    className="flex items-center gap-2.5 py-2 text-left"
                    onClick={() => togglePicked(person.id)}
                  >
                    <span className="tick">{checked && <Check size={13} />}</span>
                    <Avatar name={person.name} />
                    <span className="flex-1 text-sm">{person.name}</span>
                    {checked && perPerson > 0 && (
                      <span className="mono text-xs text-muted">{formatMoney(perPerson)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Field>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col gap-2.5 border-t border-line/60 bg-paper px-5 pt-3 pb-5">
        <p
          className={`text-center text-xs ${
            missing.length === 0 ? 'font-medium' : tried ? 'font-semibold text-accent' : 'text-muted'
          }`}
        >
          {missing.length === 0 ? summary : `Còn thiếu: ${missing.join(', ')}`}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn--ghost flex-1" onClick={onClose}>
            <X size={16} />
            Huỷ
          </button>
          <button type="button" className="btn btn--primary flex-1" onClick={save}>
            <Check size={16} />
            {initial ? 'Cập nhật' : 'Lưu'}
          </button>
        </div>
      </div>
    </>
  );
}
