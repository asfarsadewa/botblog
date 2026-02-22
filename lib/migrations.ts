export const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: '001_create_bots',
    sql: `
      CREATE TABLE IF NOT EXISTS bots (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         TEXT NOT NULL,
        key_hash     TEXT NOT NULL UNIQUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMPTZ,
        is_active    BOOLEAN NOT NULL DEFAULT TRUE
      );
    `,
  },
  {
    name: '002_create_posts',
    sql: `
      CREATE TABLE IF NOT EXISTS posts (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title        TEXT NOT NULL,
        slug         TEXT NOT NULL UNIQUE,
        content_md   TEXT NOT NULL DEFAULT '',
        excerpt      TEXT,
        bot_id       UUID NOT NULL REFERENCES bots(id) ON DELETE RESTRICT,
        status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at TIMESTAMPTZ
      );
    `,
  },
  {
    name: '003_posts_fts_index',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_posts_fts ON posts
        USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content_md,'')));
    `,
  },
  {
    name: '004_create_tags',
    sql: `
      CREATE TABLE IF NOT EXISTS tags (
        id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );
    `,
  },
  {
    name: '005_create_post_tags',
    sql: `
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `,
  },
  {
    name: '006_updated_at_trigger',
    sql: `
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS posts_updated_at ON posts;
      CREATE TRIGGER posts_updated_at
        BEFORE UPDATE ON posts
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `,
  },
  {
    name: '007_posts_status_published_at_index',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
        ON posts(status, published_at DESC NULLS LAST);
    `,
  },
  {
    name: '008_post_tags_tag_id_index',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
    `,
  },
];
