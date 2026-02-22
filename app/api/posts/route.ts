import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { toSlug } from '@/lib/utils';
import type { ApiResponse, PaginatedResponse, Post, Tag } from '@/lib/types';

async function attachTagsToPosts(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.id);
  const tagRes = await sql.query<{ post_id: string; id: string; name: string; slug: string }>(
    'SELECT pt.post_id, t.id, t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ANY($1::uuid[])',
    [ids]
  );
  const byId: Record<string, Tag[]> = {};
  for (const row of tagRes.rows) {
    if (!byId[row.post_id]) byId[row.post_id] = [];
    byId[row.post_id].push({ id: row.id, name: row.name, slug: row.slug });
  }
  return posts.map((p) => ({ ...p, tags: byId[p.id] ?? [] }));
}

// GET /api/posts — list posts (status, tag, page, limit, q)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'published';
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  try {
    let rows: Post[];
    let total: number;

    if (q) {
      const query = `%${q}%`;
      const countRes = await sql`
        SELECT COUNT(DISTINCT p.id)::text as count
        FROM posts p
        WHERE p.status = 'published'
          AND (p.title ILIKE ${query} OR p.content_md ILIKE ${query})
      `;
      total = parseInt(countRes.rows[0]?.count ?? '0');
      const res = await sql`
        SELECT p.*, b.name as bot_name
        FROM posts p
        JOIN bots b ON b.id = p.bot_id
        WHERE p.status = 'published'
          AND (p.title ILIKE ${query} OR p.content_md ILIKE ${query})
        ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      rows = res.rows as Post[];
    } else if (tag) {
      const countRes = await sql`
        SELECT COUNT(DISTINCT p.id)::text as count
        FROM posts p
        JOIN post_tags pt ON pt.post_id = p.id
        JOIN tags t ON t.id = pt.tag_id
        WHERE p.status = ${status} AND t.slug = ${tag}
      `;
      total = parseInt(countRes.rows[0]?.count ?? '0');
      const res = await sql`
        SELECT p.*, b.name as bot_name
        FROM posts p
        JOIN bots b ON b.id = p.bot_id
        JOIN post_tags pt ON pt.post_id = p.id
        JOIN tags t ON t.id = pt.tag_id
        WHERE p.status = ${status} AND t.slug = ${tag}
        ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      rows = res.rows as Post[];
    } else {
      const countRes = await sql`
        SELECT COUNT(*)::text as count FROM posts WHERE status = ${status}
      `;
      total = parseInt(countRes.rows[0]?.count ?? '0');
      const res = await sql`
        SELECT p.*, b.name as bot_name
        FROM posts p
        JOIN bots b ON b.id = p.bot_id
        WHERE p.status = ${status}
        ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      rows = res.rows as Post[];
    }

    const postsWithTags = await attachTagsToPosts(rows);

    return NextResponse.json<PaginatedResponse<Post>>({
      success: true,
      data: postsWithTags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}

// POST /api/posts — create post
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;

  let body: {
    title?: string;
    content_md?: string;
    excerpt?: string;
    tags?: string[];
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const { title, content_md = '', excerpt, tags = [], status = 'draft' } = body;
  if (!title?.trim()) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'title is required.' }, { status: 400 });
  }
  if (!['draft', 'published'].includes(status)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'status must be draft or published.' }, { status: 400 });
  }

  const slug = toSlug(title);
  const published_at = status === 'published' ? new Date().toISOString() : null;

  try {
    const res = await sql`
      INSERT INTO posts (title, slug, content_md, excerpt, bot_id, status, published_at)
      VALUES (${title.trim()}, ${slug}, ${content_md}, ${excerpt ?? null}, ${auth.bot.id}, ${status}, ${published_at})
      RETURNING *
    `;
    const post = res.rows[0] as Post;
    post.bot_name = auth.bot.name;

    if (tags.length > 0) {
      const tagObjects = await upsertTags(tags);
      for (const tag of tagObjects) {
        await sql`
          INSERT INTO post_tags (post_id, tag_id) VALUES (${post.id}, ${tag.id})
          ON CONFLICT DO NOTHING
        `;
      }
      post.tags = tagObjects;
    } else {
      post.tags = [];
    }

    return NextResponse.json<ApiResponse<Post>>({ success: true, data: post }, { status: 201 });
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === '23505') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'A post with that slug already exists.' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}

async function upsertTags(names: string[]): Promise<Tag[]> {
  const results: Tag[] = [];
  for (const name of names) {
    const slug = toSlug(name);
    await sql`
      INSERT INTO tags (name, slug) VALUES (${name}, ${slug})
      ON CONFLICT (slug) DO NOTHING
    `;
    const res = await sql`SELECT * FROM tags WHERE slug = ${slug}`;
    results.push(res.rows[0] as Tag);
  }
  return results;
}
