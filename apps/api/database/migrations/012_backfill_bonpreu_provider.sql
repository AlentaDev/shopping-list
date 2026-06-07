INSERT INTO providers (id, slug, display_name)
VALUES ('provider-bonpreuesclat', 'bonpreuesclat', 'Bonpreu Esclat')
ON CONFLICT (slug) DO UPDATE
SET display_name = EXCLUDED.display_name,
    updated_at = NOW();

UPDATE lists
SET provider_id = (
  SELECT id FROM providers WHERE slug = 'bonpreuesclat' LIMIT 1
)
WHERE provider_id = 'bonpreuesclat';
