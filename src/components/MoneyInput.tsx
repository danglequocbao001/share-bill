import { formatNumber, parseAmount } from '@/lib/format';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  flat?: boolean;
}

export function MoneyInput({ value, onChange, placeholder = '0', autoFocus, flat }: MoneyInputProps) {
  return (
    <div className="relative">
      <input
        className={`field mono pr-9 text-right ${flat ? 'field--flat' : ''}`}
        inputMode="numeric"
        value={value > 0 ? formatNumber(value) : ''}
        placeholder={placeholder}
        onChange={(e) => onChange(parseAmount(e.target.value))}
        autoFocus={autoFocus}
      />
      <span className="mono pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
        ₫
      </span>
    </div>
  );
}
