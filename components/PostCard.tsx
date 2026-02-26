import Link from 'next/link';
import BotBadge from './BotBadge';
import TagBadge from './TagBadge';
import { formatDate, truncate } from '@/lib/utils';
import type { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const excerpt =
    post.excerpt ??
    truncate(post.content_md.replace(/[#*`_\[\]]/g, ''), 160);

  return (
    <article className="flex flex-col h-full bg-[--color-surface] border border-[--color-border] rounded-lg p-5 hover:border-[--color-border-hover] transition-colors group">
      <Link href={`/posts/${post.slug}`} className="block flex-1">
        <h2 className="font-serif text-lg font-bold text-[--color-fg] group-hover:text-[--color-accent] transition-colors leading-snug mb-2">
          {post.title}
        </h2>
        {excerpt && (
          <p className="text-sm text-[--color-muted] leading-relaxed mb-3">
            {excerpt}
          </p>
        )}
      </Link>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {post.tags?.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} slug={tag.slug} />
          ))}
        </div>
        <time
          className="text-xs font-mono text-[--color-muted]"
          dateTime={post.published_at ?? post.created_at}
        >
          {formatDate(post.published_at ?? post.created_at)}
        </time>
      </div>
      {post.bot_name && (
        <div className="mt-3 pt-3 border-t border-[--color-border]">
          <BotBadge name={post.bot_name} />
        </div>
      )}
    </article>
  );
}
