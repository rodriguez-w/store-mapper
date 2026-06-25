-- Login attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL,
  ip_address TEXT,
  attempt_time TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Account lockouts table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL,
  locked_until TIMESTAMP NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TOTP backup codes for account recovery
CREATE TABLE IF NOT EXISTS totp_backup_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(user_id, user_type, attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_user ON account_lockouts(user_id, user_type, locked_until);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON totp_backup_codes(user_id, user_type, used);
