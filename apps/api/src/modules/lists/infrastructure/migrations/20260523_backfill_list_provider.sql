-- Backfill provider ownership for legacy lists
UPDATE lists
SET provider_id = (SELECT id FROM providers WHERE slug = 'mercadona' LIMIT 1)
WHERE provider_id IS NULL OR btrim(provider_id) = '' OR provider_id = 'mercadona';
