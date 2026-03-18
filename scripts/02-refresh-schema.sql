-- Simple query to verify profiles table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';
