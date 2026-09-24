import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
}

/** Bảng trượt từ dưới lên, dựng bằng <dialog>: có sẵn nền mờ, phím Esc và giữ focus bên trong. */
export function Sheet({ onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current!;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={onClose}
      // Bấm ra vùng nền mờ bên ngoài thì đóng.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </dialog>
  );
}
