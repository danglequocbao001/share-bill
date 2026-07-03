import { initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className }: AvatarProps) {
  return <span className={`avatar ${className ?? ''}`}>{initials(name)}</span>;
}
