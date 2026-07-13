-- =============================================================
-- Security RPCs — targeted auth.users lookups for the backend
-- Replace admin.listUsers() (loads the entire user table, breaks past the
-- default 50-row page) with scoped, service-role-only functions.
--
-- À exécuter sur la base Supabase.
-- =============================================================

BEGIN;

-- Resolve a single user id by email (case-insensitive). Returns NULL if none.
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

-- Fetch email + display name for a set of user ids (used to hydrate friends).
CREATE OR REPLACE FUNCTION public.get_users_by_ids(p_ids uuid[])
RETURNS TABLE (id uuid, email text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT u.id, u.email, (u.raw_user_meta_data ->> 'name') AS name
  FROM auth.users u
  WHERE u.id = ANY (p_ids);
$$;

-- Lock down: only the service_role (used by the backend) may execute these.
-- Prevents authenticated/anon clients from enumerating users.
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_users_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_by_ids(uuid[]) TO service_role;

COMMIT;
