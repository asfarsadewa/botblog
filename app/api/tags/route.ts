import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { toSlug } from '@/lib/utils';
import type { ApiResponse, Tag } from '@/lib/types';

// GET /api/tags — list tags with post counts
export async function GET() {
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
    return NextResponse.json<ApiResponse<Tag[]>>({ success: true, data: res.rows as Tag[] });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}

// POST /api/tags — create tag
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const { name } = body;
  if (!name?.trim()) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'name is required.' }, { status: 400 });
  }

  const slug = toSlug(name.trim());

  try {
    await sql`
      INSERT INTO tags (name, slug) VALUES (${name.trim()}, ${slug})
      ON CONFLICT (slug) DO NOTHING
    `;
    const res = await sql`SELECT * FROM tags WHERE slug = ${slug}`;
    return NextResponse.json<ApiResponse<Tag>>({ success: true, data: res.rows[0] as Tag }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}
