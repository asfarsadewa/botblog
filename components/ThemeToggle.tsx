'use client';

import { useEffect, useState } from 'react';

type Theme = 'auto' | 'dark' | 'light';

const CYCLE: Theme[] = ['auto', 'dark', 'light'];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    setTheme(stored ?? 'auto');
  }, []);

  const toggle = () => {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];
    setTheme(next);
    const html = document.documentElement;
    if (next === 'auto') {
      html.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Theme: ${theme}. Click to cycle.`}
      className="font-mono text-xs text-[--color-muted] hover:text-[--color-fg] transition-colors border border-[--color-border] hover:border-[--color-border-hover] px-2 py-0.5 rounded"
    >
      {theme}
    </button>
  );
}
