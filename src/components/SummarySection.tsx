import { useMemo } from 'react';
import { useBillStore } from '@/store/useBillStore';
import { computeBalances } from '@/lib/calc';
import { formatMoney } from '@/lib/format';
import { Avatar } from '@/components/Avatar';

const signed = (value: number) => `${value > 0 ? '+' : '−'} ${formatMoney(Math.abs(value))}`;

/** Cân đối: mỗi người một dòng + thanh xanh/đỏ, chạm để xem cách tính. */
export function SummarySection() {
  const people = useBillStore((s) => s.people);
  const expenses = useBillStore((s) => s.expenses);

  const balances = useMemo(
    () => [...computeBalances(people, expenses)].sort((a, b) => b.balance - a.balance),
    [people, expenses],
  );

  if (people.length === 0) {
    return <p className="sect-hint text-center italic">Thêm người và khoản chi để xem cân đối.</p>;
  }

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? '—';
  const largest = Math.max(1, ...balances.map((b) => Math.abs(b.balance)));

  return (
    <section className="flex flex-col">
      <p className="sect-hint no-print text-center">Chạm vào tên để xem cách tính</p>
      <div className="flex flex-col divide-y divide-line/60">
        {balances.map((b) => {
          const positive = b.balance > 0.5;
          const negative = b.balance < -0.5;
          const tone = positive ? 'text-positive' : negative ? 'text-accent' : 'text-muted';
          const lines: [string, number][] = [
            ['Đã trả', b.paid],
            ['Phần phải chịu', -b.share],
            ['Được tài trợ', b.sponsoredReceived],
            ['Tài trợ cho nhóm', -b.sponsoredGiven],
            ['Đã chuyển đi', b.sent],
            ['Đã nhận lại', -b.received],
          ];

          return (
            <details key={b.personId} className="py-2">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <Avatar name={nameOf(b.personId)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{nameOf(b.personId)}</span>
                    <span className={`mono shrink-0 text-sm font-bold ${tone}`}>
                      {positive || negative ? signed(b.balance) : 'Đã đủ'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                      <div
                        className={`h-full rounded-full ${positive ? 'bg-positive' : 'bg-accent'}`}
                        style={{ width: `${(Math.abs(b.balance) / largest) * 100}%` }}
                      />
                    </div>
                    <span className={`w-16 text-right text-[0.68rem] ${tone}`}>
                      {positive ? 'được nhận' : negative ? 'phải trả' : 'không nợ'}
                    </span>
                  </div>
                </div>
              </summary>

              <div className="mono mt-2 ml-9 flex flex-col gap-0.5 rounded-lg bg-cream px-3 py-2 text-xs">
                {lines
                  .filter(([, value]) => Math.abs(value) > 0.5)
                  .map(([label, value]) => (
                    <div key={label} className="leader">
                      <span className="font-sans text-muted">{label}</span>
                      <span className="leader__dots" />
                      <span>{signed(value)}</span>
                    </div>
                  ))}
                <div className={`leader mt-1 border-t border-line pt-1 font-bold ${tone}`}>
                  <span className="font-sans">Còn lại</span>
                  <span className="leader__dots" />
                  <span>{positive || negative ? signed(b.balance) : formatMoney(0)}</span>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
