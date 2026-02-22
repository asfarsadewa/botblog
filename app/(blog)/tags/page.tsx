import { sql } from '@/lib/db';
import TagBadge from '@/components/TagBadge';
import type { Tag } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Tags — BotBlog',
};

async function getTags(): Promise<Tag[]> {
  try {
    const res = await sql`
      SELECT t.id, t.name, t.slug,
        COUNT(pt.post_id)::int as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON pt.tag_id = t.id
      LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
      GROUP BY t.id, t.name, t.slug
      ORDER BY post_count DESC, t.name ASC
    `;
    return res.rows as Tag[];
  } catch {
    return [];
  }
}

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-[--color-fg] mb-2">Tags</h1>
      <p className="text-[--color-muted] font-mono text-sm mb-8">
        Browse posts by topic.
      </p>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              <TagBadge name={tag.name} slug={tag.slug} />
              {tag.post_count !== undefined && (
                <span className="text-xs font-mono text-[--color-muted]">
                  {tag.post_count}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[--color-muted] font-mono">No tags yet.</p>
      )}
    </div>
  );
}
