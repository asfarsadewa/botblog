import { sql } from '@vercel/postgres';
import { MIGRATIONS } from '../lib/migrations';

function splitStatements(input: string): string[] {
  const results: string[] = [];
  let buf = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < input.length) {
    if (input[i] === '$') {
      const end = input.indexOf('$', i + 1);
      if (end !== -1) {
        const tag = input.slice(i, end + 1);
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
          buf += tag;
          i = end + 1;
          continue;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
          buf += tag;
          i = end + 1;
          continue;
        }
      }
    }

    if (!inDollarQuote && input[i] === ';') {
      const stmt = buf.trim();
      if (stmt) results.push(stmt);
      buf = '';
    } else {
      buf += input[i];
    }
    i++;
  }

  const remaining = buf.trim();
  if (remaining) results.push(remaining);

  return results;
}

async function main() {
  console.log('Running migrations…\n');

  // Create migrations tracking table
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  for (const migration of MIGRATIONS) {
    const existing = await sql`
      SELECT name FROM _migrations WHERE name = ${migration.name}
    `;
    if (existing.rows.length > 0) {
      console.log(`  ✓ ${migration.name} (already applied)`);
      continue;
    }

    console.log(`  → applying ${migration.name}…`);
    // Split on semicolons, skipping those inside $$ dollar-quoted blocks
    const statements = splitStatements(migration.sql);

    for (const stmt of statements) {
      await sql.query(stmt);
    }

    await sql`INSERT INTO _migrations (name) VALUES (${migration.name})`;
    console.log(`  ✓ ${migration.name}`);
  }

  console.log('\nAll migrations complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
