import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, ExpenseDraft, ID, Person } from '@/types';

interface BillState {
  title: string;
  people: Person[];
  expenses: Expense[];

  setTitle: (title: string) => void;

  addPerson: (name: string) => void;
  renamePerson: (id: ID, name: string) => void;
  /** Trả về false nếu người này đang là người trả tiền của một khoản nào đó. */
  removePerson: (id: ID) => boolean;

  addEntry: (draft: ExpenseDraft) => void;
  updateEntry: (id: ID, patch: Partial<ExpenseDraft>) => void;
  removeEntry: (id: ID) => void;
  duplicateEntry: (id: ID) => void;

  reset: () => void;
}

const uid = (): ID => crypto.randomUUID();

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      title: 'HÓA ĐƠN CHUNG',
      people: [],
      expenses: [],

      setTitle: (title) => set({ title }),

      addPerson: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({ people: [...state.people, { id: uid(), name: trimmed }] }));
      },

      renamePerson: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        }));
      },

      removePerson: (id) => {
        const isPayer = get().expenses.some((e) => e.payerId === id);
        if (isPayer) return false;
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
    { name: 'share-bill-v1' },
  ),
);
