import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  name: string;
  slug: string;
  className?: string;
}

export default function TagBadge({ name, slug, className }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${slug}`}
      className={cn(
        'inline-block px-2 py-0.5 text-xs font-mono rounded',
        'bg-[--color-surface] text-[--color-muted] border border-[--color-border]',
        'hover:border-[--color-accent] hover:text-[--color-accent] transition-colors',
        className
      )}
    >
      #{name}
    </Link>
  );
}
