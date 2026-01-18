CREATE TABLE refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX refresh_tokens_active_device_idx
  ON refresh_tokens(user_id, fingerprint)
  WHERE revoked_at IS NULL;

CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);
