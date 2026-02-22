import { NextRequest, NextResponse } from 'next/server';
import { sql } from './db';
import type { AuthenticatedBot, ApiResponse } from './types';

export async function hashKey(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateApiKey(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `bb_${hex}`;
}

export function extractKey(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  const xApiKey = req.headers.get('X-API-Key');
  return xApiKey || null;
}

export async function validateBotKey(raw: string): Promise<AuthenticatedBot | null> {
  const hash = await hashKey(raw);
  const result = await sql`
    SELECT id, name, is_active
    FROM bots
    WHERE key_hash = ${hash} AND is_active = TRUE
  `;
  if (result.rows.length === 0) return null;
  const bot = result.rows[0] as AuthenticatedBot;
  // fire-and-forget last_used_at update
  sql`UPDATE bots SET last_used_at = NOW() WHERE id = ${bot.id}`.catch(() => {});
  return bot;
}

export async function requireAuth(
  req: NextRequest
): Promise<{ bot: AuthenticatedBot } | { response: NextResponse }> {
  const raw = extractKey(req);
  if (!raw) {
    return {
      response: NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing API key.' },
        { status: 401 }
      ),
    };
  }
  const bot = await validateBotKey(raw);
  if (!bot) {
    return {
      response: NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or inactive API key.' },
        { status: 401 }
      ),
    };
  }
  return { bot };
}
