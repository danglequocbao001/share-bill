import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { EntryKind, ID } from '@/types';
import { DEFAULT_TITLE, useBillStore } from '@/store/useBillStore';
import { computeBalances, grandTotal, resolveParticipants, simplifyDebts, totalByKind } from '@/lib/calc';
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import { BALANCE_PARTS } from '@/components/SummarySection';

interface KindSection {
  kind: EntryKind;
  title: string;
  hint: string;
  payer: string;
  split: string;
  /** Cột "mỗi người" — chuyển tiền chỉ có một người nhận nên không cần. */
  each?: string;
}

const SECTIONS: KindSection[] = [
  {
    kind: 'expense',
    title: 'Chi tiêu',
    hint: 'Gồm cả tạm ứng, chi hộ: người trả được nhận lại phần của những người cùng chia.',
    payer: 'Người trả',
    split: 'Chia cho',
    each: 'Mỗi người',
  },
  {
    kind: 'sponsorship',
    title: 'Tài trợ',
    hint: 'Không đòi lại: người tài trợ gánh phần này thay cho những người được giảm.',
    payer: 'Người tài trợ',
    split: 'Giảm cho',
    each: 'Mỗi người được giảm',
  },
  {
    kind: 'transfer',
    title: 'Chuyển tiền',
    hint: 'Các lần đã chuyển trả nợ cho nhau.',
    payer: 'Người chuyển',
    split: 'Người nhận',
  },
];

const fileDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** "+300.450" · "−85.390" · "—" khi bằng 0. Bảng in không kèm ₫, đơn vị ghi ở đầu trang. */
const signed = (value: number) =>
  Math.abs(value) < 0.5 ? '—' : `${value > 0 ? '+' : '−'}${formatNumber(Math.abs(value))}`;

/** Cột "Còn lại": [chữ, màu]. */
const outcome = (balance: number): [string, string] => {
  if (balance > 0.5) return [`Được nhận ${formatNumber(balance)}`, 'text-positive'];
  if (balance < -0.5) return [`Phải trả ${formatNumber(-balance)}`, 'text-accent'];
  return ['Đã đủ', 'text-muted'];
};

/** Bản in / PDF: ẩn trên màn hình, khi in thì thay cả giao diện bằng bảng kê đầy đủ. */
export function PrintReport() {
  const title = useBillStore((s) => s.title);
  const people = useBillStore((s) => s.people);
  const expenses = useBillStore((s) => s.expenses);
  const rounding = useBillStore((s) => s.rounding);
  const [printedAt, setPrintedAt] = useState(Date.now);

  // Ngay trước khi in (nút hay Ctrl+P): chốt giờ xuất, đổi tiêu đề trang để tên file PDF gợi ý có nghĩa.
  useEffect(() => {
    const appTitle = document.title;
    const before = () => {
      flushSync(() => setPrintedAt(Date.now()));
      const name = useBillStore.getState().title || DEFAULT_TITLE;
      document.title = `${name} ${fileDate.format(Date.now()).replaceAll('/', '-')}`;
    };
    const after = () => {
      document.title = appTitle;
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const balances = computeBalances(people, expenses).sort((a, b) => b.balance - a.balance);
  const settlements = simplifyDebts(balances, rounding);
  const toTransfer = settlements.reduce((sum, s) => sum + s.amount, 0);
  // Chỉ giữ những cột có số, ví dụ không ai tài trợ thì bỏ hai cột tài trợ.
  const columns = BALANCE_PARTS.filter(([, part]) => balances.some((b) => Math.abs(part(b)) > 0.5));
  const entries = [...expenses].sort((a, b) => a.createdAt - b.createdAt);
  const nameOf = (id: ID) => people.find((p) => p.id === id)?.name ?? 'Người đã xoá';

  const stats: [string, number][] = [
    ['Tổng chi tiêu', grandTotal(expenses)],
    ['Được tài trợ', totalByKind(expenses, 'sponsorship')],
    ['Đã chuyển trả', totalByKind(expenses, 'transfer')],
    [`Còn cần chuyển · ${settlements.length} lần`, toTransfer],
  ];

  return (
    <article className="report hidden print:block">
      <header className="flex items-end justify-between gap-4 border-b-[1.5pt] border-ink pb-2">
        <div>
          <p className="text-[8pt] uppercase tracking-[0.3em] text-muted">Phiếu chia tiền</p>
          <h1>{title || DEFAULT_TITLE}</h1>
        </div>
        <p className="shrink-0 text-right text-[8.5pt] text-muted">
          Xuất lúc {formatDateTime(printedAt)}
          <br />
          {people.length} người · {expenses.length} khoản · Đơn vị: đồng
        </p>
      </header>

      {expenses.length === 0 ? (
        <p className="mt-4">Chưa có khoản nào.</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-4 gap-2">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-md border border-line px-2.5 py-2">
                <dt className="text-[7.5pt] uppercase tracking-wider text-muted">{label}</dt>
                <dd className="mt-0.5 text-[12pt] font-bold">{formatMoney(value)}</dd>
              </div>
            ))}
          </dl>

          {SECTIONS.map(({ kind, title, hint, payer, split, each }) => {
            const rows = entries.filter((e) => e.kind === kind);
            if (rows.length === 0) return null;
            return (
              <section key={kind}>
                <h2>{title}</h2>
                <p className="sect-hint">{hint}</p>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nội dung</th>
                      <th>{payer}</th>
                      <th>{split}</th>
                      <th className="num">Số tiền</th>
                      {each && <th className="num">{each}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry, i) => {
                      const ids = resolveParticipants(entry, people);
                      return (
                        <tr key={entry.id}>
                          <td>{i + 1}</td>
                          <td>{entry.title || '—'}</td>
                          <td>{nameOf(entry.payerId)}</td>
                          <td>
                            {entry.splitMode === 'equal'
                              ? `Cả nhóm (${ids.length} người)`
                              : ids.map(nameOf).join(', ') || '—'}
                          </td>
                          <td className="num">{formatNumber(entry.amount)}</td>
                          {each && (
                            <td className="num">{ids.length > 0 ? formatNumber(entry.amount / ids.length) : '—'}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Tổng cộng</td>
                      <td className="num">{formatNumber(totalByKind(expenses, kind))}</td>
                      {each && <td />}
                    </tr>
                  </tfoot>
                </table>
              </section>
            );
          })}

          <section>
            <h2>Cân đối từng người</h2>
            <p className="sect-hint">Còn lại = cộng các cột bên trái: dương là được nhận lại, âm là còn phải trả.</p>
            <table>
              <thead>
                <tr>
                  <th>Người</th>
                  {columns.map(([label]) => (
                    <th key={label} className="num">
                      {label}
                    </th>
                  ))}
                  <th className="num">Còn lại</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => {
                  const [text, tone] = outcome(b.balance);
                  return (
                    <tr key={b.personId}>
                      <td>{nameOf(b.personId)}</td>
                      {columns.map(([label, part]) => (
                        <td key={label} className="num">
                          {signed(part(b))}
                        </td>
                      ))}
                      <td className={`num font-semibold ${tone}`}>{text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section>
            <h2>{rounding ? 'Cần thanh toán (đã làm tròn)' : 'Cần thanh toán'}</h2>
            {settlements.length === 0 ? (
              <p className="mt-1">Mọi người đã cân bằng, không ai cần chuyển thêm.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Người chuyển</th>
                    <th>Người nhận</th>
                    <th className="num">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s, i) => (
                    <tr key={`${s.fromId}-${s.toId}-${i}`}>
                      <td>{i + 1}</td>
                      <td>{nameOf(s.fromId)}</td>
                      <td>{nameOf(s.toId)}</td>
                      <td className="num font-semibold">{formatNumber(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Tổng cộng</td>
                    <td className="num">{formatNumber(toTransfer)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
            {rounding && (
              <p className="sect-hint mt-1.5">
                Số tiền đã làm tròn tới nghìn: phần lẻ dưới 200 ₫ thì bỏ, từ 200 ₫ trở lên thì làm tròn lên.
              </p>
            )}
          </section>
        </>
      )}

      <footer className="mt-8 text-center text-[8pt] text-muted">Chia Hóa Đơn · Share Bill</footer>
    </article>
  );
}
