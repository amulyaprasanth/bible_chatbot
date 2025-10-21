-- Rollback: Remove Google OAuth fields from users table
-- Date: 2025-10-21
-- Description: Removes Google OAuth support (use only if you want to revert changes)

-- Warning: This will remove all Google OAuth user data!
-- Make sure to backup your database before running this script

-- Remove indices
DROP INDEX IF EXISTS idx_users_google_id ON users;
DROP INDEX IF EXISTS idx_users_auth_provider ON users;

-- Remove columns
ALTER TABLE users 
DROP COLUMN IF EXISTS google_id;

ALTER TABLE users 
DROP COLUMN IF EXISTS auth_provider;

-- Make password_hash NOT NULL again (if needed)
-- Warning: This will fail if you have OAuth users without passwords
-- ALTER TABLE users 
-- MODIFY COLUMN password_hash VARCHAR(256) NOT NULL;

-- Verify the changes
DESCRIBE users;

