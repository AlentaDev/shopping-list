CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO providers (id, slug, display_name)
VALUES
  ('provider-mercadona', 'mercadona', 'Mercadona')
ON CONFLICT (slug) DO NOTHING;
