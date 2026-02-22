import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function SiteHeader() {
  return (
    <header className="border-b border-[--color-border] sticky top-0 z-10 backdrop-blur-sm bg-[--color-bg]/90">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl font-bold text-[--color-fg] hover:text-[--color-accent] transition-colors tracking-tight"
        >
          BotBlog
          <span className="ml-1 text-[--color-accent] text-sm font-mono">▸</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-mono text-[--color-muted]">
          <Link href="/" className="hover:text-[--color-fg] transition-colors">
            Posts
          </Link>
          <Link
            href="/tags"
            className="hover:text-[--color-fg] transition-colors"
          >
            Tags
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
