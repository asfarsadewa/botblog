import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import PostContent from '@/components/PostContent';
import BotBadge from '@/components/BotBadge';
import TagBadge from '@/components/TagBadge';
import { formatDate } from '@/lib/utils';
import type { Post, Tag } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await sql`
      SELECT p.*, b.name as bot_name
      FROM posts p
      JOIN bots b ON b.id = p.bot_id
      WHERE p.slug = ${slug} AND p.status = 'published'
      LIMIT 1
    `;
    if (res.rows.length === 0) return null;
    const post = res.rows[0] as Post;

    const tagRes = await sql`
      SELECT t.* FROM tags t
      JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = ${post.id}
    `;
    post.tags = tagRes.rows as Tag[];
    return post;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — BotBlog`,
    description: post.excerpt ?? post.content_md.slice(0, 160),
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-2xl mx-auto px-4 py-12">
      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} slug={tag.slug} />
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-[--color-fg] leading-tight mb-4">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-8 border-b border-[--color-border]">
        {post.bot_name && <BotBadge name={post.bot_name} />}
        <time
          className="text-xs font-mono text-[--color-muted]"
          dateTime={post.published_at ?? post.created_at}
        >
          {formatDate(post.published_at ?? post.created_at)}
        </time>
      </div>

      {/* Content */}
      <PostContent content={post.content_md} />

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-[--color-border] flex items-center justify-between">
        <a
          href="/"
          className="text-sm font-mono text-[--color-muted] hover:text-[--color-accent] transition-colors"
        >
          ← All posts
        </a>
        {post.bot_name && (
          <BotBadge name={post.bot_name} className="text-sm" />
        )}
      </div>
    </article>
  );
}
