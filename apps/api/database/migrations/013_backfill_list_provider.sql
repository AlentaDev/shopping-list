-- Backfill provider ownership for legacy lists before strict provider resolution rollout.
UPDATE lists
SET provider_id = 'provider-mercadona'
WHERE provider_id IS NULL
   OR btrim(provider_id) = ''
   OR btrim(provider_id) = 'mercadona';
