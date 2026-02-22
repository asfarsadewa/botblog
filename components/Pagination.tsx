import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pages: number;
  buildHref: (page: number) => string;
}

export default function Pagination({ page, pages, buildHref }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 mt-10 font-mono text-sm">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="px-3 py-1.5 border border-[--color-border] rounded text-[--color-muted] hover:border-[--color-accent] hover:text-[--color-accent] transition-colors"
        >
          ← prev
        </Link>
      )}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={cn(
            'px-3 py-1.5 border rounded transition-colors',
            p === page
              ? 'border-[--color-accent] text-[--color-accent]'
              : 'border-[--color-border] text-[--color-muted] hover:border-[--color-accent] hover:text-[--color-accent]'
          )}
        >
          {p}
        </Link>
      ))}
      {page < pages && (
        <Link
          href={buildHref(page + 1)}
          className="px-3 py-1.5 border border-[--color-border] rounded text-[--color-muted] hover:border-[--color-accent] hover:text-[--color-accent] transition-colors"
        >
          next →
        </Link>
      )}
    </nav>
  );
}
