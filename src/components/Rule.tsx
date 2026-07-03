interface RuleProps {
  label?: string;
  className?: string;
}

export function Rule({ label, className }: RuleProps) {
  if (!label) return <hr className={`rule ${className ?? ''}`} />;

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <span className="rule h-0 flex-1" />
      <span className="sect-title shrink-0">{label}</span>
      <span className="rule h-0 flex-1" />
    </div>
  );
}
