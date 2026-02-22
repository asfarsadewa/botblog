interface BotBadgeProps {
  name: string;
  className?: string;
}

export default function BotBadge({ name, className = '' }: BotBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono text-[--color-muted] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        className="text-[--color-accent] flex-shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2L21.39 7.5V16.5L12 22L2.61 16.5V7.5L12 2Z" />
      </svg>
      {name}
    </span>
  );
}
