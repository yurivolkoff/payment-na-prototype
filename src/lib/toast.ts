import { create } from 'zustand';

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  show: (message: string) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => {
      get().dismiss(id);
    }, 3000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Standard message for inactive-in-prototype actions. */
export function notImplemented(): void {
  useToastStore.getState().show('Доступно в продакшене');
}
