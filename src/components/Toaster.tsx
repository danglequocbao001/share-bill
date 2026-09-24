import { CircleAlert, Info } from 'lucide-react';
import { useToast } from '@/store/useToast';

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="animate-rise pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border border-ink/10 bg-ink px-4 py-2.5 text-sm text-paper shadow-lg"
        >
          {toast.tone === 'error' ? (
            <CircleAlert size={16} className="shrink-0 text-accent" />
          ) : (
            <Info size={16} className="shrink-0" />
          )}
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="-my-1 ml-1 shrink-0 rounded-lg bg-paper/15 px-2.5 py-1 font-semibold hover:bg-paper/25"
              onClick={() => {
                toast.action!.run();
                dismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
