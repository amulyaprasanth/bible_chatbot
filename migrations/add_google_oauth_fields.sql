-- Migration: Add Google OAuth fields to users table
-- Date: 2025-10-21
-- Description: Adds auth_provider and google_id fields to support Google OAuth authentication

-- Make password_hash nullable (OAuth users don't need passwords)
ALTER TABLE users 
MODIFY COLUMN password_hash VARCHAR(256) NULL;

-- Add auth_provider field (local or google)
ALTER TABLE users 
ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';

-- Add google_id field (Google user identifier)
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(100) UNIQUE NULL;

-- Optional: Add index on auth_provider for faster queries
CREATE INDEX idx_users_auth_provider ON users(auth_provider);

-- Optional: Add index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Verify the changes
DESCRIBE users;

