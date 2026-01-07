-- Migration: Add Brute Force Protection Columns to admin_users

ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- Optional: Add index for performance if table gets large (unlikely for admin_users but good practice)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
