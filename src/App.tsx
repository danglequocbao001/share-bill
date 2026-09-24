import { useState, type ReactNode } from 'react';
import { ChevronRight, Plus, Printer, RotateCcw, TriangleAlert } from 'lucide-react';
import type { Expense } from '@/types';
import { useBillStore, withUndo } from '@/store/useBillStore';
import { computeBalances, grandTotal, simplifyDebts } from '@/lib/calc';
import { formatMoney } from '@/lib/format';
import { Rule } from '@/components/Rule';
import { TornEdge } from '@/components/TornEdge';
import { ReceiptHeader } from '@/components/ReceiptHeader';
import { ReceiptFooter } from '@/components/ReceiptFooter';
import { PeopleSection } from '@/components/PeopleSection';
import { EntriesSection, ReceiptItems } from '@/components/EntriesSection';
import { EntrySheet } from '@/components/EntryForm';
import { SummarySection } from '@/components/SummarySection';
import { SettlementSection } from '@/components/SettlementSection';
import { Sheet } from '@/components/Sheet';
import { Toaster } from '@/components/Toaster';

function Block({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Rule label={label} />
      {children}
    </div>
  );
}

type Tab = 'entries' | 'settle';

export default function App() {
  const title = useBillStore((s) => s.title);
  const setTitle = useBillStore((s) => s.setTitle);
  const people = useBillStore((s) => s.people);
  const expenses = useBillStore((s) => s.expenses);
  const reset = useBillStore((s) => s.reset);

  const [tab, setTab] = useState<Tab>('entries');
  const [sheet, setSheet] = useState<{ entry?: Expense } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const transfersNeeded = simplifyDebts(computeBalances(people, expenses)).length;
  const hasData = people.length > 0 || expenses.length > 0;

  return (
    <div className="min-h-dvh w-full px-4 pt-6 pb-28 sm:pt-10">
      <main className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
        <header className="no-print flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="mono text-[0.62rem] uppercase tracking-[0.35em] text-muted">
              Phiếu chia tiền
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Tên hóa đơn (chạm để sửa)"
              spellCheck={false}
              placeholder="TÊN HÓA ĐƠN"
              className="mono w-full border-b-[1.5px] border-dashed border-ink/25 bg-transparent py-1 text-xl font-bold uppercase tracking-wide text-ink outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </div>
          <button
            type="button"
            className="btn btn--ghost mt-4 bg-paper px-3 py-2 text-xs"
            onClick={() => setConfirmReset(true)}
            disabled={!hasData}
          >
            <RotateCcw size={14} />
            Làm mới
          </button>
        </header>

        {expenses.length > 0 && (
          <button
            type="button"
            className="no-print flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-left shadow-sm transition-shadow hover:shadow-md"
            onClick={() => setTab('settle')}
          >
            <span className="flex-1">
              <span className="sect-hint block">Tổng chi</span>
              <span className="mono block text-lg font-bold">{formatMoney(grandTotal(expenses))}</span>
            </span>
            <span className="text-right">
              <span className="block text-sm font-semibold">
                {transfersNeeded > 0 ? `${transfersNeeded} lần chuyển là xong` : 'Đã cân bằng'}
              </span>
              <span className="sect-hint block">
                {transfersNeeded > 0 ? 'Xem ai trả ai' : 'Không ai nợ ai'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        )}

        <nav className="no-print sticky top-0 z-10 -mx-4 bg-sand/85 px-4 py-2 backdrop-blur">
          <div className="seg" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'entries'}
              className="seg__item"
              data-active={tab === 'entries'}
              onClick={() => setTab('entries')}
            >
              Khoản chi · {expenses.length}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'settle'}
              className="seg__item"
              data-active={tab === 'settle'}
              onClick={() => setTab('settle')}
            >
              Thanh toán{transfersNeeded > 0 && ` · ${transfersNeeded}`}
            </button>
          </div>
        </nav>

        {tab === 'entries' ? (
          <section className="flex flex-col gap-5 rounded-2xl bg-paper px-5 py-5 shadow-sm">
            <Block label="Người tham gia">
              <PeopleSection />
            </Block>
            <Block label="Khoản chi">
              <EntriesSection onOpen={(entry) => setSheet({ entry })} />
            </Block>
          </section>
        ) : (
          <>
            <div className="receipt-shadow mt-3">
              <div className="receipt flex flex-col gap-5 px-6 pt-8 pb-9 sm:px-8">
                <TornEdge side="top" />
                <ReceiptHeader />

                <Block label="Cân đối">
                  <SummarySection />
                </Block>

                <Block label="Chi tiết">
                  <ReceiptItems />
                </Block>

                <Block label="Cần thanh toán">
                  <SettlementSection />
                </Block>

                <Rule />
                <ReceiptFooter />
                <TornEdge side="bottom" />
              </div>
            </div>

            <button
              type="button"
              className="no-print btn btn--ghost btn--block mt-3 bg-paper"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              In / Lưu PDF
            </button>
          </>
        )}

        <p className="no-print text-center text-[0.68rem] text-ink/50">
          Dữ liệu được lưu tự động trên trình duyệt của bạn — không cần đăng nhập.
        </p>

        <footer className="text-center">
          <p className="mono text-[0.85rem] tracking-wide text-ink/45">
            © {new Date().getFullYear()} Dang Le Quoc Bao
          </p>
        </footer>
      </main>

      {people.length > 0 && (
        <button
          type="button"
          className="no-print btn btn--primary fixed inset-x-0 bottom-5 z-40 mx-auto w-fit rounded-full px-6 py-3.5 shadow-lg"
          onClick={() => setSheet({})}
        >
          <Plus size={18} />
          Thêm khoản
        </button>
      )}

      {sheet && <EntrySheet initial={sheet.entry} onClose={() => setSheet(null)} />}

      {confirmReset && (
        <Sheet onClose={() => setConfirmReset(false)}>
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-accent-soft">
              <TriangleAlert size={20} className="text-accent" />
            </div>
            <h2 className="mb-1 text-base font-semibold">Làm mới toàn bộ?</h2>
            <p className="sect-hint">Tất cả người, khoản chi và kết quả sẽ bị xóa.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn--ghost flex-1" onClick={() => setConfirmReset(false)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn--accent flex-1"
              onClick={() => {
                setConfirmReset(false);
                withUndo('Đã làm mới hóa đơn', reset);
              }}
            >
              Xóa hết
            </button>
          </div>
        </Sheet>
      )}
      <Toaster />
    </div>
  );
}
