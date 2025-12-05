-- This script is designed to fix the "Database error saving new user" error
-- which is typically caused by a broken trigger on the auth.users table.

-- 1. Attempt to drop the most common trigger names that might be causing this issue.
-- These commands are safe to run even if the trigger doesn't exist.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.on_user_created();

-- 2. If the above doesn't fix it, run this query to see what triggers exist on auth.users:
SELECT 
    trigger_name, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- If you see any results from the query above, you will need to drop that trigger manually using:
-- DROP TRIGGER IF EXISTS [trigger_name] ON auth.users;
