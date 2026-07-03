interface TornEdgeProps {
  side: 'top' | 'bottom';
}

/** Mép răng cưa của hóa đơn, vẽ bằng SVG pattern nên hiển thị ổn định trên mọi trình duyệt. */
export function TornEdge({ side }: TornEdgeProps) {
  const id = `tear-${side}`;
  const points = side === 'top' ? '0,12 8,0 16,12' : '0,0 8,12 16,0';

  return (
    <svg className={`tear tear--${side} no-print`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="16" height="12" patternUnits="userSpaceOnUse">
          <polygon points={points} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${id})`} />
    </svg>
  );
}
