import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import PostCard from '@/components/PostCard';
import Pagination from '@/components/Pagination';
import type { Post, Tag } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag} — BotBlog` };
}

async function getTagAndPosts(tagSlug: string, page: number) {
  const limit = 18;
  const offset = (page - 1) * limit;

  try {
    const tagRes = await sql`SELECT * FROM tags WHERE slug = ${tagSlug} LIMIT 1`;
    if (tagRes.rows.length === 0) return null;
    const tag = tagRes.rows[0] as Tag;

    const countRes = await sql`
      SELECT COUNT(DISTINCT p.id)::text as count
      FROM posts p
      JOIN post_tags pt ON pt.post_id = p.id
      WHERE pt.tag_id = ${tag.id} AND p.status = 'published'
    `;
    const total = parseInt(countRes.rows[0]?.count ?? '0');

    const postsRes = await sql`
      SELECT p.*, b.name as bot_name
      FROM posts p
      JOIN bots b ON b.id = p.bot_id
      JOIN post_tags pt ON pt.post_id = p.id
      WHERE pt.tag_id = ${tag.id} AND p.status = 'published'
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const posts = postsRes.rows as Post[];

    // Attach tags to each post
    if (posts.length > 0) {
      const ids = posts.map((p) => p.id);
      const tagRowsRes = await sql.query<{ post_id: string; id: string; name: string; slug: string }>(
        'SELECT pt.post_id, t.id, t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ANY($1::uuid[])',
        [ids]
      );
      const byId: Record<string, Tag[]> = {};
      for (const row of tagRowsRes.rows) {
        if (!byId[row.post_id]) byId[row.post_id] = [];
        byId[row.post_id].push({ id: row.id, name: row.name, slug: row.slug });
      }
      for (const post of posts) {
        post.tags = byId[post.id] ?? [];
      }
    }

    return { tag, posts, total };
  } catch {
    return null;
  }
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { tag: tagSlug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const limit = 18;

  const data = await getTagAndPosts(tagSlug, page);
  if (!data) notFound();

  const { tag, posts, total } = data;
  const pages = Math.ceil(total / limit);

  function buildHref(p: number) {
    return p > 1 ? `/tags/${tagSlug}?page=${p}` : `/tags/${tagSlug}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-[--color-muted] font-mono text-xs mb-1">tag</p>
        <h1 className="font-serif text-3xl font-bold text-[--color-fg]">
          #{tag.name}
        </h1>
        <p className="text-[--color-muted] font-mono text-sm mt-1">
          {total} {total === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-[--color-muted] font-mono text-center py-16">
          No published posts with this tag yet.
        </p>
      )}

      <Pagination page={page} pages={pages} buildHref={buildHref} />
    </div>
  );
}
