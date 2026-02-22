import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminSecret } from '@/lib/admin-auth';
import { generateApiKey, hashKey } from '@/lib/auth';
import type { ApiResponse, Bot } from '@/lib/types';

// GET /api/keys — list bots (no raw keys)
export async function GET(req: NextRequest) {
  const check = requireAdminSecret(req);
  if ('response' in check) return check.response;

  try {
    const res = await sql`
      SELECT id, name, created_at, last_used_at, is_active
      FROM bots
      ORDER BY created_at DESC
    `;
    return NextResponse.json<ApiResponse<Omit<Bot, 'key_hash'>[]>>({
      success: true,
      data: res.rows as Omit<Bot, 'key_hash'>[],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}

// POST /api/keys — create bot — returns raw key once only
export async function POST(req: NextRequest) {
  const check = requireAdminSecret(req);
  if ('response' in check) return check.response;

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

  const rawKey = generateApiKey();
  const hash = await hashKey(rawKey);

  try {
    const res = await sql`
      INSERT INTO bots (name, key_hash)
      VALUES (${name.trim()}, ${hash})
      RETURNING id, name, created_at, last_used_at, is_active
    `;
    const bot = res.rows[0] as Omit<Bot, 'key_hash'>;
    return NextResponse.json<ApiResponse<Omit<Bot, 'key_hash'> & { api_key: string }>>(
      { success: true, data: { ...bot, api_key: rawKey } },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}
