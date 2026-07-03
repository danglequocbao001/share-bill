import { useMemo } from 'react';
import { useBillStore } from '@/store/useBillStore';
import { formatDateTime } from '@/lib/format';

export function ReceiptHeader() {
  const title = useBillStore((s) => s.title);
  const setTitle = useBillStore((s) => s.setTitle);
  const peopleCount = useBillStore((s) => s.people.length);
  const itemCount = useBillStore((s) => s.expenses.length);

  const meta = useMemo(
    () => ({
      date: formatDateTime(Date.now()),
      no: String(Math.floor(1000 + Math.random() * 9000)),
    }),
    [],
  );

  return (
    <header className="flex flex-col items-center gap-1 text-center">
      <div className="mono text-[0.62rem] uppercase tracking-[0.35em] text-muted">
        Phiếu chia tiền
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Tên hóa đơn"
        spellCheck={false}
        className="mono w-full bg-transparent text-center text-2xl font-bold uppercase tracking-wide text-ink outline-none placeholder:text-sand"
        placeholder="TÊN HÓA ĐƠN"
      />

      <div className="mono flex w-full items-center justify-between text-[0.68rem] text-muted">
        <span>No. {meta.no}</span>
        <span>{meta.date}</span>
      </div>
      <div className="mono flex w-full items-center justify-between text-[0.68rem] text-muted">
        <span>{peopleCount} người</span>
        <span>{itemCount} khoản</span>
      </div>
    </header>
  );
}
