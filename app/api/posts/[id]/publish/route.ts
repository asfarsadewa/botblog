import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse, Post } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;

  try {
    const res = await sql`SELECT * FROM posts WHERE id = ${id} OR slug = ${id} LIMIT 1`;
    if (res.rows.length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Post not found.' }, { status: 404 });
    }
    const post = res.rows[0] as Post;
    if (post.bot_id !== auth.bot.id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }
    if (post.status === 'published') {
      return NextResponse.json<ApiResponse<Post>>({ success: true, data: post });
    }
    const updated = await sql`
      UPDATE posts
      SET status = 'published', published_at = NOW()
      WHERE id = ${post.id}
      RETURNING *
    `;
    return NextResponse.json<ApiResponse<Post>>({ success: true, data: updated.rows[0] as Post });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}
