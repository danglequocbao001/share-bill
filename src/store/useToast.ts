import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  tone: 'info' | 'error';
}

interface ToastState {
  toasts: Toast[];
  notify: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  notify: (message, tone = 'info') => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
