import { sql } from '@vercel/postgres';
import { MIGRATIONS } from '../lib/migrations';

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
    // Execute multi-statement SQL by splitting on semicolon groups
    // (vercel/postgres executes one statement at a time)
    const statements = migration.sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      if (stmt) {
        await sql.query(stmt);
      }
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
