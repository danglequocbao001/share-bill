import { useMemo } from 'react';
import { ArrowRight, Check, PartyPopper } from 'lucide-react';
import { useBillStore } from '@/store/useBillStore';
import { computeBalances, simplifyDebts } from '@/lib/calc';
import { formatMoney } from '@/lib/format';

export function SettlementSection() {
  const people = useBillStore((s) => s.people);
  const expenses = useBillStore((s) => s.expenses);
  const rounding = useBillStore((s) => s.rounding);
  const setRounding = useBillStore((s) => s.setRounding);

  const settlements = useMemo(
    () => simplifyDebts(computeBalances(people, expenses), rounding),
    [people, expenses, rounding],
  );

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? '—';

  // Hiện cả lúc đã cân bằng: có khi chính việc làm tròn đã bỏ đi mấy khoản lẻ.
  const roundingToggle = (
    <button
      type="button"
      role="checkbox"
      aria-checked={rounding}
      className="sect-hint flex items-center gap-2 self-center text-left hover:text-ink"
      onClick={() => setRounding(!rounding)}
    >
      <span className="tick">{rounding && <Check size={13} />}</span>
      Làm tròn
    </button>
  );

  if (expenses.length === 0) {
    return (
      <p className="sect-hint text-center italic">Chưa có khoản nào để tính ai trả ai.</p>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-2 text-center">
        <PartyPopper size={22} className="text-positive" />
        <p className="text-sm font-medium text-positive">Mọi người đã cân bằng!</p>
        <p className="sect-hint">Không ai còn nợ ai cả.</p>
        {roundingToggle}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <p className="sect-hint text-center">
        Cần <span className="font-semibold text-ink">{settlements.length}</span> lần chuyển khoản:
      </p>

      <div className="flex flex-col gap-2">
        {settlements.map((s, i) => (
          <div
            key={`${s.fromId}-${s.toId}-${i}`}
            className="animate-rise flex items-center gap-2 rounded-xl border border-sand bg-cream/50 px-3 py-2.5"
            title={`${nameOf(s.fromId)} trả ${nameOf(s.toId)} ${formatMoney(s.amount)}`}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-sm font-medium">{nameOf(s.fromId)}</span>
              <ArrowRight size={15} className="shrink-0 text-muted" />
              <span className="truncate text-sm font-medium">{nameOf(s.toId)}</span>
            </span>
            <span className="mono shrink-0 whitespace-nowrap text-sm font-bold text-accent">
              {formatMoney(s.amount)}
            </span>
          </div>
        ))}
      </div>

      <p className="sect-hint text-center">
        Ai chuyển rồi thì bấm “Thêm khoản” → Chuyển tiền để ghi lại.
      </p>
      {roundingToggle}
    </section>
  );
}
