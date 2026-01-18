CREATE TABLE list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  source TEXT,
  source_product_id TEXT,
  name_snapshot TEXT,
  thumbnail_snapshot TEXT,
  price_snapshot NUMERIC(10, 2),
  unit_size_snapshot NUMERIC(12, 4),
  unit_format_snapshot TEXT,
  unit_price_per_unit_snapshot NUMERIC(12, 6),
  is_approx_size_snapshot BOOLEAN,
  name TEXT,
  qty INTEGER NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT list_items_kind_check CHECK (kind IN ('manual', 'catalog'))
);

CREATE INDEX list_items_list_id_idx ON list_items(list_id);
