import { useState, type ReactNode } from 'react';
import { Printer, RotateCcw, TriangleAlert } from 'lucide-react';
import { useBillStore } from '@/store/useBillStore';
import { Rule } from '@/components/Rule';
import { TornEdge } from '@/components/TornEdge';
import { ReceiptHeader } from '@/components/ReceiptHeader';
import { ReceiptFooter } from '@/components/ReceiptFooter';
import { PeopleSection } from '@/components/PeopleSection';
import { EntriesSection } from '@/components/EntriesSection';
import { SummarySection } from '@/components/SummarySection';
import { SettlementSection } from '@/components/SettlementSection';
import { Toaster } from '@/components/Toaster';

function Block({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Rule label={label} />
      {children}
    </div>
  );
}

export default function App() {
  const reset = useBillStore((s) => s.reset);
  const hasData = useBillStore((s) => s.people.length > 0 || s.expenses.length > 0);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="min-h-dvh w-full px-4 py-8 sm:py-12">
      <main className="mx-auto w-full max-w-[460px]">
        <div className="receipt-shadow">
          <div className="receipt flex flex-col gap-5 px-6 pt-8 pb-9 sm:px-8">
            <TornEdge side="top" />
            <ReceiptHeader />

            <Block label="Người tham gia">
              <PeopleSection />
            </Block>

            <Block label="Khoản chi">
              <EntriesSection
                kind="expense"
                addLabel="Thêm khoản chi"
                emptyHint="Chưa có khoản chi nào."
              />
            </Block>

            <Block label="Tạm ứng / Chi hộ">
              <EntriesSection
                kind="prepayment"
                addLabel="Thêm khoản tạm ứng"
                emptyHint="Ai đó ứng tiền mua đồ chung? Ghi lại tại đây."
              />
            </Block>

            <Block label="Tài trợ">
              <EntriesSection
                kind="sponsorship"
                addLabel="Thêm khoản tài trợ"
                emptyHint="Có ai bao / tài trợ một phần cho nhóm? Ghi lại để giảm trừ."
              />
            </Block>

            <Block label="Cân đối">
              <SummarySection />
            </Block>

            <Block label="Cần thanh toán">
              <SettlementSection />
            </Block>

            <Rule />
            <ReceiptFooter />
            <TornEdge side="bottom" />
          </div>
        </div>

        <div className="no-print mt-5 flex gap-2">
          <button
            type="button"
            className="btn btn--ghost btn--block bg-paper"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            In / Lưu PDF
          </button>
          <button
            type="button"
            className="btn btn--ghost bg-paper"
            onClick={() => setConfirmReset(true)}
            disabled={!hasData}
          >
            <RotateCcw size={16} />
            Làm mới
          </button>
        </div>

        <p className="no-print mt-3 text-center text-[0.68rem] text-ink/50">
          Dữ liệu được lưu tự động trên trình duyệt của bạn — không cần đăng nhập.
        </p>

        <footer className="mt-2 text-center">
          <p className="mono text-[0.85rem] tracking-wide text-ink/45">
            © {new Date().getFullYear()} Dang Le Quoc Bao
          </p>
        </footer>
      </main>

      {confirmReset && (
        <div
          className="no-print fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="animate-rise w-full max-w-xs rounded-2xl bg-paper p-5 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-accent-soft">
              <TriangleAlert size={20} className="text-accent" />
            </div>
            <h2 className="mb-1 text-base font-semibold">Làm mới toàn bộ?</h2>
            <p className="sect-hint mb-4">
              Tất cả người, khoản chi và kết quả sẽ bị xóa. Không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn--ghost flex-1"
                onClick={() => setConfirmReset(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn--accent flex-1"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
              >
                Xóa hết
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
