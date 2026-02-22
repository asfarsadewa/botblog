import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from './types';

export function requireAdminSecret(
  req: NextRequest
): { ok: true } | { response: NextResponse } {
  const secret = req.headers.get('X-Admin-Secret');
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    return {
      response: NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin secret not configured.' },
        { status: 500 }
      ),
    };
  }
  if (!secret || secret !== expected) {
    return {
      response: NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      ),
    };
  }
  return { ok: true };
}
