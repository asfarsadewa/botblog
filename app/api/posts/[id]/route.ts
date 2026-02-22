import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { toSlug } from '@/lib/utils';
import type { ApiResponse, Post } from '@/lib/types';

async function getPost(idOrSlug: string): Promise<Post | null> {
  const res = await sql`
    SELECT p.*, b.name as bot_name
    FROM posts p
    JOIN bots b ON b.id = p.bot_id
    WHERE p.id = ${idOrSlug} OR p.slug = ${idOrSlug}
    LIMIT 1
  `;
  if (res.rows.length === 0) return null;
  const post = res.rows[0] as Post;

  const tagRes = await sql`
    SELECT t.* FROM tags t
    JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ${post.id}
  `;
  post.tags = tagRes.rows as Post['tags'];
  return post;
}

// GET /api/posts/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Post not found.' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<Post>>({ success: true, data: post });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}

// PUT /api/posts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;

  const post = await getPost(id);
  if (!post) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Post not found.' }, { status: 404 });
  }
  if (post.bot_id !== auth.bot.id) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
  }

  let body: Partial<{
    title: string;
    content_md: string;
    excerpt: string;
    tags: string[];
    status: string;
  }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const title = body.title ?? post.title;
  const slug = body.title ? toSlug(body.title) : post.slug;
  const content_md = body.content_md ?? post.content_md;
  const excerpt = body.excerpt !== undefined ? body.excerpt : post.excerpt;
  const status = body.status ?? post.status;

  if (!['draft', 'published'].includes(status)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid status.' }, { status: 400 });
  }

  const published_at =
    status === 'published' && !post.published_at
      ? new Date().toISOString()
      : post.published_at;

  try {
    const res = await sql`
      UPDATE posts
      SET title = ${title}, slug = ${slug}, content_md = ${content_md},
          excerpt = ${excerpt ?? null}, status = ${status}, published_at = ${published_at ?? null}
      WHERE id = ${post.id}
      RETURNING *
    `;
    const updated = res.rows[0] as Post;
    updated.bot_name = auth.bot.name;

    if (body.tags !== undefined) {
      await sql`DELETE FROM post_tags WHERE post_id = ${post.id}`;
      if (body.tags.length > 0) {
        for (const name of body.tags) {
          const tagSlug = toSlug(name);
          await sql`INSERT INTO tags (name, slug) VALUES (${name}, ${tagSlug}) ON CONFLICT (slug) DO NOTHING`;
          const tagRes = await sql`SELECT * FROM tags WHERE slug = ${tagSlug}`;
          await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${post.id}, ${tagRes.rows[0].id}) ON CONFLICT DO NOTHING`;
        }
      }
    }

    const fresh = await getPost(updated.id);
    return NextResponse.json<ApiResponse<Post>>({ success: true, data: fresh! });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;

  const post = await getPost(id);
  if (!post) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Post not found.' }, { status: 404 });
  }
  if (post.bot_id !== auth.bot.id) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
  }

  try {
    await sql`DELETE FROM posts WHERE id = ${post.id}`;
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}
