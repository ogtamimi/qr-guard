-- QR Guard Payment System Migration
-- This migration adds the payments table and updates the users table for the new payment flow.

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('pro', 'enterprise')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index on userId for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments(userId);
-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Update users table to add plan and dailyLimit columns
-- We assume the users table already exists. If not, this will fail, but we assume it exists from the existing system.
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    ADD COLUMN IF NOT EXISTS dailyLimit INTEGER;

-- Set default dailyLimit for existing users based on plan (if plan is set)
-- We cannot do this in a migration without knowing the existing data, so we leave it to the application to set.
-- Alternatively, we can set a default for free and pro, and leave enterprise as NULL.
-- We'll set a default for free and pro, and for enterprise we leave it as NULL (which means unlimited).
-- But note: we cannot set a conditional default in SQL easily. We'll leave it to the application.

-- However, we can set a default for the dailyLimit column and then update based on plan.
-- We'll set the default to 500 for pro and null for enterprise and free? 
-- But free should have a limit too? The existing system might have a different way.
-- We'll leave the dailyLimit as nullable and let the application set it.

-- We'll add a comment to explain.
COMMENT ON COLUMN users.plan IS 'Subscription plan: free, pro, enterprise';
COMMENT ON COLUMN users.dailyLimit IS 'Daily scan limit: null for unlimited (enterprise), 500 for pro, and 0 or null for free? Application should set accordingly.';

-- Note: The actual default for free might be 0 or a low number. We'll leave it to the application to set on user creation or plan change.