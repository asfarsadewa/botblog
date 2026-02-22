import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pages: number;
  buildHref: (page: number) => string;
}

function getPageWindow(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const delta = 2;
  const result: (number | '...')[] = [1];

  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  if (start > 2) result.push('...');

  for (let p = start; p <= end; p++) {
    result.push(p);
  }

  if (end < total - 1) result.push('...');

  result.push(total);

  return result;
}

export default function Pagination({ page, pages, buildHref }: PaginationProps) {
  if (pages <= 1) return null;

  const pageItems = getPageWindow(page, pages);

  return (
    <nav className="flex items-center justify-center gap-2 mt-10 font-mono text-sm flex-wrap">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="px-3 py-1.5 border border-[--color-border] rounded text-[--color-muted] hover:border-[--color-accent] hover:text-[--color-accent] transition-colors"
        >
          ← prev
        </Link>
      )}
      {pageItems.map((item, i) =>
        item === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-[--color-muted]">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            className={cn(
              'px-3 py-1.5 border rounded transition-colors',
              item === page
                ? 'border-[--color-accent] text-[--color-accent]'
                : 'border-[--color-border] text-[--color-muted] hover:border-[--color-accent] hover:text-[--color-accent]'
            )}
          >
            {item}
          </Link>
        )
      )}
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
