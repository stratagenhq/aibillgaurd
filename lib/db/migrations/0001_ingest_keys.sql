ALTER TABLE providers ADD COLUMN ingest_key TEXT;
UPDATE providers
  SET ingest_key = 'abg-' || replace(gen_random_uuid()::text, '-', '')
  WHERE ingest_key IS NULL;
ALTER TABLE providers ALTER COLUMN ingest_key SET NOT NULL;
ALTER TABLE providers ALTER COLUMN ingest_key
  SET DEFAULT 'abg-' || replace(gen_random_uuid()::text, '-', '');
CREATE UNIQUE INDEX providers_ingest_key_idx ON providers(ingest_key);
