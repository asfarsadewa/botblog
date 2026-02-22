import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { ApiResponse, Post, Tag } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'q is required.' }, { status: 400 });
  }

  try {
    const res = await sql`
      SELECT
        p.*,
        b.name as bot_name,
        ts_rank(
          to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.content_md,'')),
          plainto_tsquery('english', ${q})
        ) as rank
      FROM posts p
      JOIN bots b ON b.id = p.bot_id
      WHERE p.status = 'published'
        AND to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.content_md,''))
            @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC, p.published_at DESC
      LIMIT 20
    `;

    const posts = res.rows as (Post & { rank: number })[];
    const ids = posts.map((p) => p.id);

    if (ids.length > 0) {
      const tagRes = await sql.query<{ post_id: string; id: string; name: string; slug: string }>(
        'SELECT pt.post_id, t.id, t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ANY($1::uuid[])',
        [ids]
      );
      const byId: Record<string, Tag[]> = {};
      for (const row of tagRes.rows) {
        if (!byId[row.post_id]) byId[row.post_id] = [];
        byId[row.post_id].push({ id: row.id, name: row.name, slug: row.slug });
      }
      for (const post of posts) {
        post.tags = byId[post.id] ?? [];
      }
    }

    return NextResponse.json<ApiResponse<Post[]>>({ success: true, data: posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}
