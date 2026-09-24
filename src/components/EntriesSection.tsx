import type { Expense } from '@/types';
import { useBillStore } from '@/store/useBillStore';
import { grandTotal, totalByKind } from '@/lib/calc';
import { formatMoney } from '@/lib/format';
import { EntryRow } from '@/components/EntryRow';

/** Danh sách mọi khoản (mới nhất ở trên), chạm vào để sửa. */
export function EntriesSection({ onOpen }: { onOpen: (entry: Expense) => void }) {
  const hasPeople = useBillStore((s) => s.people.length > 0);
  const expenses = useBillStore((s) => s.expenses);

  if (!hasPeople) {
    return (
      <p className="sect-hint text-center italic">
        Thêm người tham gia ở trên trước, rồi bấm “Thêm khoản” để ghi.
      </p>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="sect-hint text-center italic">
        Chưa có khoản nào. Bấm “Thêm khoản” ở cuối màn hình để ghi khoản đầu tiên.
      </p>
    );
  }

  const entries = [...expenses].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="flex flex-col gap-1">
      <p className="sect-hint text-center">Mới nhất ở trên · chạm vào một khoản để sửa</p>
      <div className="flex flex-col divide-y divide-line/60">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="animate-rise -mx-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-cream"
            onClick={() => onOpen(entry)}
          >
            <EntryRow expense={entry} />
          </button>
        ))}
      </div>
    </section>
  );
}

/** Bản chỉ đọc cho tờ hóa đơn: theo thứ tự thời gian, kèm tổng. */
export function ReceiptItems() {
  const expenses = useBillStore((s) => s.expenses);

  if (expenses.length === 0) {
    return <p className="sect-hint text-center italic">Chưa có khoản nào.</p>;
  }

  const entries = [...expenses].sort((a, b) => a.createdAt - b.createdAt);
  const sponsored = totalByKind(expenses, 'sponsorship');

  return (
    <section className="flex flex-col">
      <div className="flex flex-col divide-y divide-line/60">
        {entries.map((entry) => (
          <div key={entry.id} className="py-1.5">
            <EntryRow expense={entry} />
          </div>
        ))}
      </div>
      <div className="leader mt-2 pt-2">
        <span className="text-xs uppercase tracking-wider text-muted">Tổng chi</span>
        <span className="leader__dots" />
        <span className="mono text-sm font-semibold">{formatMoney(grandTotal(expenses))}</span>
      </div>
      {sponsored > 0 && (
        <div className="leader">
          <span className="text-xs uppercase tracking-wider text-muted">Được tài trợ</span>
          <span className="leader__dots" />
          <span className="mono text-sm font-semibold text-positive">−{formatMoney(sponsored)}</span>
        </div>
      )}
    </section>
  );
}
