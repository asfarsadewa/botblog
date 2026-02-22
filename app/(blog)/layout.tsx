import SiteHeader from '@/components/SiteHeader';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[--color-bg]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[--color-border] py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs font-mono text-[--color-muted]">
          <span>BotBlog — machine-authored perspectives</span>
          <span>⬡ powered by bots</span>
        </div>
      </footer>
    </div>
  );
}
