import { useMemo } from 'react';
import { useBillStore } from '@/store/useBillStore';
import { computeBalances, grandTotal, totalByKind } from '@/lib/calc';
import { formatMoney } from '@/lib/format';
import { Avatar } from '@/components/Avatar';

export function SummarySection() {
  const people = useBillStore((s) => s.people);
  const expenses = useBillStore((s) => s.expenses);

  const balances = useMemo(() => {
    const list = computeBalances(people, expenses);
    return [...list].sort((a, b) => b.balance - a.balance);
  }, [people, expenses]);

  const total = grandTotal(expenses);
  const sponsorTotal = totalByKind(expenses, 'sponsorship');
  const perHead = people.length > 0 ? total / people.length : 0;

  if (people.length === 0) {
    return <p className="sect-hint text-center italic">Thêm người và khoản chi để xem cân đối.</p>;
  }

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? '—';

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-cream px-3 py-2">
          <p className="sect-hint">Tổng hóa đơn</p>
          <p className="mono text-base font-bold">{formatMoney(total)}</p>
        </div>
        <div className="rounded-xl bg-cream px-3 py-2">
          <p className="sect-hint">Bình quân / người</p>
          <p className="mono text-base font-bold">{formatMoney(perHead)}</p>
        </div>
        {sponsorTotal > 0 && (
          <div className="col-span-2 flex items-baseline justify-between rounded-xl bg-positive-soft px-3 py-2">
            <p className="sect-hint text-positive">Được tài trợ / bao</p>
            <p className="mono text-base font-bold text-positive">− {formatMoney(sponsorTotal)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col divide-y divide-line/60">
        {balances.map((b) => {
          const positive = b.balance > 0.5;
          const negative = b.balance < -0.5;
          const tone = positive ? 'text-positive' : negative ? 'text-accent' : 'text-muted';
          const label = positive
            ? `+ ${formatMoney(b.balance)}`
            : negative
              ? `− ${formatMoney(-b.balance)}`
              : 'Đã đủ';

          const netShare = b.share - b.sponsoredReceived;
          return (
            <div key={b.personId} className="flex items-center gap-3 py-2">
              <Avatar name={nameOf(b.personId)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{nameOf(b.personId)}</p>
                <p className="sect-hint mono">
                  Trả {formatMoney(b.paid)} · Phần {formatMoney(netShare)}
                  {b.sponsoredGiven > 0 && ` · Tài trợ ${formatMoney(b.sponsoredGiven)}`}
                </p>
              </div>
              <span className={`mono shrink-0 text-sm font-bold ${tone}`}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 text-[0.68rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-positive" /> được nhận lại
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> còn phải trả
        </span>
      </div>
    </section>
  );
}
