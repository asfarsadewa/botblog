import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminSecret } from '@/lib/admin-auth';
import type { ApiResponse } from '@/lib/types';

// DELETE /api/keys/[id] — revoke bot
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = requireAdminSecret(req);
  if ('response' in check) return check.response;

  try {
    const res = await sql`
      UPDATE bots SET is_active = FALSE WHERE id = ${id} RETURNING id
    `;
    if (res.rows.length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Bot not found.' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Database error.' }, { status: 500 });
  }
}
