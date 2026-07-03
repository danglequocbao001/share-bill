export function ReceiptFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 text-center">
      <div className="barcode mt-1 w-3/4" />
      <p className="mono text-[0.6rem] tracking-[0.25em] text-muted">
        SHARE·BILL·{new Date().getFullYear()}
      </p>
    </footer>
  );
}
