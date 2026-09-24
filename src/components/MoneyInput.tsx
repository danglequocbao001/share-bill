import { useState } from 'react';
import { formatMoney, formatNumber, parseAmount } from '@/lib/format';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  autoFocus?: boolean;
  invalid?: boolean;
}

/**
 * Ô nhập tiền: hiểu "50k", "1tr2" (bàn phím máy tính); gõ số ngắn thì gợi ý thêm số 0
 * như app ngân hàng (bàn phím số trên điện thoại không có chữ).
 */
export function MoneyInput({ value, onChange, autoFocus, invalid }: MoneyInputProps) {
  const formatted = value > 0 ? formatNumber(value) : '';
  const [text, setText] = useState(formatted);
  const suggestions = /^\d{1,3}$/.test(text) && value > 0 ? [1e3, 1e4, 1e5].map((m) => value * m) : [];

  const pick = (next: number) => {
    onChange(next);
    setText(formatNumber(next));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          className="field mono pr-9 text-right text-xl font-bold"
          inputMode="numeric"
          placeholder="0"
          aria-label="Số tiền"
          aria-invalid={invalid}
          // autoFocus lo lúc form hiện ra trong bảng đang mở; data-autofocus lo lúc bảng vừa mở.
          autoFocus={autoFocus}
          data-autofocus={autoFocus || undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseAmount(e.target.value));
          }}
          onBlur={() => setText(formatted)}
        />
        <span className="mono pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          ₫
        </span>
      </div>

      {suggestions.length > 0 ? (
        <div className="flex gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="chip mono flex-1 justify-center px-2 py-2 text-xs"
              onClick={() => pick(s)}
            >
              {formatNumber(s)}
            </button>
          ))}
        </div>
      ) : (
        text !== formatted && (
          <p className="sect-hint mono text-right">= {formatMoney(value)}</p>
        )
      )}
    </div>
  );
}
