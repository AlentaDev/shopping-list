ALTER TABLE lists
ADD COLUMN IF NOT EXISTS provider_id TEXT;

UPDATE lists
SET provider_id = (
  SELECT id FROM providers WHERE slug = 'mercadona' LIMIT 1
)
WHERE provider_id IS NULL OR btrim(provider_id) = '' OR provider_id = 'mercadona';

ALTER TABLE lists
ALTER COLUMN provider_id SET NOT NULL;

ALTER TABLE lists
ADD CONSTRAINT lists_provider_id_fkey
FOREIGN KEY (provider_id)
REFERENCES providers(id)
ON UPDATE RESTRICT
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS lists_owner_status_provider_idx
ON lists(owner_user_id, status, provider_id);
