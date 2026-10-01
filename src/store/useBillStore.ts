import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, ExpenseDraft, ID, Person } from '@/types';
import { useToast } from '@/store/useToast';

export const DEFAULT_TITLE = 'Hóa đơn chung';

interface BillState {
  title: string;
  /** Luôn xếp theo tên A→Z. */
  people: Person[];
  expenses: Expense[];
  /** Làm tròn số tiền ở mục "Cần thanh toán" (mặc định bật). Không bị xoá khi làm mới. */
  rounding: boolean;

  setTitle: (title: string) => void;
  setRounding: (rounding: boolean) => void;

  /** Trả về false nếu tên trống hoặc trùng với người đã có. */
  addPerson: (name: string) => boolean;
  renamePerson: (id: ID, name: string) => boolean;
  /** Trả về false nếu người này đang là người trả / người nhận của một khoản nào đó. */
  removePerson: (id: ID) => boolean;

  addEntry: (draft: ExpenseDraft) => void;
  updateEntry: (id: ID, patch: Partial<ExpenseDraft>) => void;
  removeEntry: (id: ID) => void;
  duplicateEntry: (id: ID) => void;

  reset: () => void;
}

const uid = (): ID => crypto.randomUUID();

const sameName = (a: string, b: string) =>
  a.normalize('NFC').toLocaleLowerCase('vi') === b.normalize('NFC').toLocaleLowerCase('vi');

/** So tên theo thứ tự chữ cái tiếng Việt (a ă â … d đ …). */
const collator = new Intl.Collator('vi');
const byName = (a: Person, b: Person) => collator.compare(a.name, b.name);

/** "  minh   anh " → "Minh Anh": bỏ khoảng trắng thừa, viết hoa chữ cái đầu mỗi từ. */
const cleanName = (raw: string) =>
  raw
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase('vi') + word.slice(1))
    .join(' ');

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      title: DEFAULT_TITLE,
      people: [],
      expenses: [],
      rounding: true,

      setTitle: (title) => set({ title }),
      setRounding: (rounding) => set({ rounding }),

      addPerson: (raw) => {
        const name = cleanName(raw);
        if (!name || get().people.some((p) => sameName(p.name, name))) return false;
        set((state) => ({ people: [...state.people, { id: uid(), name }].sort(byName) }));
        return true;
      },

      renamePerson: (id, raw) => {
        const name = cleanName(raw);
        if (!name || get().people.some((p) => p.id !== id && sameName(p.name, name))) return false;
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, name } : p)).sort(byName),
        }));
        return true;
      },

      removePerson: (id) => {
        const inUse = get().expenses.some(
          (e) => e.payerId === id || (e.kind === 'transfer' && e.participantIds.includes(id)),
        );
        if (inUse) return false;
        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
          expenses: state.expenses.map((e) => ({
            ...e,
            participantIds: e.participantIds.filter((pid) => pid !== id),
          })),
        }));
        return true;
      },

      addEntry: (draft) => {
        set((state) => ({
          expenses: [...state.expenses, { ...draft, id: uid(), createdAt: Date.now() }],
        }));
      },

      updateEntry: (id, patch) => {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }));
      },

      removeEntry: (id) => {
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
      },

      duplicateEntry: (id) => {
        set((state) => {
          const original = state.expenses.find((e) => e.id === id);
          if (!original) return state;
          return {
            expenses: [
              ...state.expenses,
              { ...original, id: uid(), createdAt: Date.now() },
            ],
          };
        });
      },

      reset: () => set({ title: DEFAULT_TITLE, people: [], expenses: [] }),
    }),
    {
      name: 'share-bill-v1',
      version: 2,
      // v0 có mục "Tạm ứng" riêng — tính y hệt khoản chi nên gộp vào. v1 lưu người theo thứ tự thêm.
      migrate: (persisted) => {
        const state = persisted as BillState;
        return {
          ...state,
          people: [...state.people].sort(byName),
          expenses: state.expenses.map((e) =>
            (e.kind as string) === 'prepayment' ? { ...e, kind: 'expense' as const } : e,
          ),
        };
      },
    },
  ),
);

/** Chạy một thao tác xoá rồi hiện toast "Hoàn tác". `run` trả false nghĩa là không xoá được. */
export const withUndo = (message: string, run: () => boolean | void): boolean => {
  const { title, people, expenses } = useBillStore.getState();
  if (run() === false) return false;
  // ponytail: hoàn tác = trả lại cả ảnh chụp dữ liệu; sửa gì trong lúc toast còn hiện cũng mất theo.
  useToast.getState().notify(message, 'info', {
    label: 'Hoàn tác',
    run: () => useBillStore.setState({ title, people, expenses }),
  });
  return true;
};
