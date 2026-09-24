import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, ExpenseDraft, ID, Person } from '@/types';
import { useToast } from '@/store/useToast';

interface BillState {
  title: string;
  people: Person[];
  expenses: Expense[];

  setTitle: (title: string) => void;

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

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      title: 'HÓA ĐƠN CHUNG',
      people: [],
      expenses: [],

      setTitle: (title) => set({ title }),

      addPerson: (name) => {
        const trimmed = name.trim();
        if (!trimmed || get().people.some((p) => sameName(p.name, trimmed))) return false;
        set((state) => ({ people: [...state.people, { id: uid(), name: trimmed }] }));
        return true;
      },

      renamePerson: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed || get().people.some((p) => p.id !== id && sameName(p.name, trimmed))) return false;
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
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

      reset: () => set({ title: 'HÓA ĐƠN CHUNG', people: [], expenses: [] }),
    }),
    {
      name: 'share-bill-v1',
      version: 1,
      // v0 có mục "Tạm ứng" riêng — tính y hệt khoản chi nên gộp vào.
      migrate: (persisted) => {
        const state = persisted as BillState;
        return {
          ...state,
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
