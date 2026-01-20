-- Add email verification fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationCode" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationCodeExpiry" TIMESTAMP(3);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "users_emailVerified_idx" ON users("emailVerified");

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('emailVerified', 'verificationCode', 'verificationCodeExpiry');
